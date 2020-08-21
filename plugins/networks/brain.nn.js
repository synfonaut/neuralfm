const log = require("debug")("neuralfm:plugins:networks:brainnn");
const config = require("../../config");
const utils = require("../../utils");
const database = require("../../core/db").db;

const brain = require("brain.js");

// hackkkkkkkk for too long mongodb index names
function makeNameSmaller(name) {
    return name
        .replace("BSVTwitterScraper", "BTS")
        .replace("TwitterFeatureExtractor", "TFE")
        .replace("StandardFeatureNormalizer", "SFN")
}

export class BrainNeuralNetwork {
    constructor(scraper, extractor, normalizer, classifier, opts={}) {
        if (!scraper) { throw "expected scraper" }
        if (!extractor) { throw "expected extractor" }
        if (!normalizer) { throw "expected normalizer" }
        if (!classifier) { throw "expected classifier" }

        this.scraper = scraper;
        this.extractor = extractor;
        this.normalizer = normalizer;
        this.classifier = classifier;

        this.name = makeNameSmaller(`${this.scraper.constructor.name}:${this.extractor.constructor.name}:${this.normalizer.constructor.name}:${this.classifier.name}`);
        this.nn = null;
        this.isDirty = true;
        this.normalizationMetadata = {};
        this.classifications = {};
        this.data = [];
        this.trainingData = [];
        this.trainedDate = null;
        this.maxTrainingRows = 1000;
        this.fingerprint = `${this.name}:${Object.keys(this.classifications).length}:${Date.now()}`;

        this.trainingOptions = (opts.trainingOptions ? opts.trainingOptions : BrainNeuralNetwork.getDefaultTrainingOptions());
        this.networkOptions = (opts.networkOptions ? opts.networkOptions : BrainNeuralNetwork.getDefaultNeuralNetworkOptions());

        this.trainingOptions
    }

    async run() {
        this.classifications = await this.classifier.getClassifications();

        if (Object.keys(this.classifications).length == 0) {
            log(`no classifications to train ${this.name}`);
            throw `no classifications to train ${this.name}`;
        }

        let normalizationMetadata = await this.normalizer.getMetadata();
        if (normalizationMetadata) {
            log(`found existing normalization metdata`);
        } else {
            log(`missing normalization metdata... generating ...WARNING this could be expensive!`);
            const data = await this.normalizer.getDataSource();
            normalizationMetadata = await this.normalizer.createNormalizationMetadata(data);
        }

        if (this.nn) {
            log(`reusing existing neural network`);
        } else {
            this.nn = this.createNeuralNetwork();
        }

        this.trainingData = await this.normalizer.getTrainingData(this.classifier);
        if (this.trainingData.length === 0) {
            throw `none of the classifications match the training data ${this.name}`;
        }

        if (!this.trainingData.callback) {
            this.trainingData.callback = BrainNeuralNetwork.getDefaultTrainingOptions().callback;
        }

        this.trainingOptions = {
            iterations: 10000,
            errorThresh: 0.005,
            callback: (stats={}) => {
                log(`training iterations=${stats.iterations} error=${stats.error} for ${this.name}`);
            },
            callbackPeriod: 1,
        };


        log(`training ${this.name} on ${this.trainingData.length} classifications`);
        const starttime = Date.now();
        this.nn.train(this.trainingData, this.trainingOptions);
        const endtime = Date.now();
        log(`finished training ${this.name} in ${(endtime-starttime) / 1000}s`);

        this.isDirty = false;
        this.trainedDate = new Date();

        /*
        // HACKY....can only have 64 mongodb indexes LOL
        const indexQuery = {};
        const indexKeyField = `predictions.${this.fingerprint}`;
        indexQuery[indexKeyField] = 1;

        try {
            await this.normalizer.db.collection(this.scraper.constructor.getCollectionName()).dropIndex(indexQuery);
        } catch (e) {
            log(`warning: index query couldn't be dropped`);
        }
        */

        this.fingerprint = `${this.name}:${Object.keys(this.classifications).length}:${this.trainedDate.getTime()}`;
    }

    async calculate() {
        if (!this.nn) { throw "expected neural network" }

        const normalizedFieldName = this.normalizer.constructor.getNormalizedFieldName(this.extractor);
        const predictionUpdates = [];

        log(`calculating predictions for ${this.fingerprint}`);

        let numCalculated = 0;
        let row;
        const cursor = await this.normalizer.getDataCursor();
        while (row = await cursor.next()) {
            const normalizedData = row[normalizedFieldName];
            const input = this.normalizer.constructor.convertToTrainingDataInput(normalizedData);
            const prediction = this.nn.run(input)[0];

            const predictionUpdate = {
                "updateOne": {
                    "upsert": true,
                    "filter": {
                        "classification": this.classifier.name,
                        "network_fingerprint": this.fingerprint,
                        "content_fingerprint": row.fingerprint,
                    },
                    "update": { "$set": { prediction } }
                }
            };

            predictionUpdates.push(predictionUpdate);
            numCalculated += 1;
            if ((numCalculated % 500) == 0) {
                log(`calculated predictions for ${numCalculated}`);
            }

            if (numCalculated >= this.maxTrainingRows) {
                log(`reached maxTrainingRows ${this.maxTrainingRows}`);
                break;
            }
        }

        const db = await BrainNeuralNetwork.getDatabase();
        const response = await db.collection(this.constructor.getPredictionsCollectionName()).bulkWrite(predictionUpdates, {"w": 1});
        db.close();

        log(`updated predictions for ${predictionUpdates.length} items for ${this.fingerprint}`);

        /*
        const indexQuery = {};
        const indexKeyField = `predictions.${this.fingerprint}`;
        indexQuery[indexKeyField] = 1;

        await this.normalizer.db.collection(this.scraper.constructor.getCollectionName()).createIndex(indexQuery);
        */
    }

    async getDataSource(sortKey="created_at", sortDirection=1, prediction_filter=null, prediction_limit=200) {
        const db = await BrainNeuralNetwork.getDatabase();

        const findQuery = {
            classification: this.classifier.name
        };

        if (prediction_filter !== null) {
            findQuery["prediction"] = {"$gte": prediction_filter};
        }

        const predictions = await (db.collection(BrainNeuralNetwork.getPredictionsCollectionName()).find(findQuery).limit(prediction_limit).toArray());
        db.close();

        const contentPredictions = {};
        for (const prediction of predictions) {
            contentPredictions[prediction.content_fingerprint] = prediction;
        }

        const content = await (this.normalizer.db.collection(this.scraper.constructor.getCollectionName()).find({"fingerprint": {"$in": Object.keys(contentPredictions)}})).toArray();

        const predictedContent = content.map(c => {
            let prediction = contentPredictions[c.fingerprint];
            if (typeof prediction == "undefined") { return c }
            c.predictions = {};
            c.predictions[prediction.network_fingerprint] = prediction.prediction;
            return c;
        });

        return predictedContent;
    }

    // DEPRECATE OR CHANGE
    async updatePrediction(fingerprint, prediction) {
        const findQuery = { fingerprint };
        const updateQuery = { "$set": { "predictions": {} } };

        updateQuery["$set"]["predictions"][this.fingerprint] = prediction;

        const response = await this.normalizer.db.collection(this.scraper.constructor.getCollectionName()).updateOne(findQuery, updateQuery, {"upsert": true});
        if (!utils.ok(response)) {
            log(`error response while updating prediction - ${response}`);
            throw "error updating prediction"
        }

        if (response.result.n === 1) {
            // TODO: make this bulk
            //log(`created prediction for ${fingerprint} to ${prediction} for ${this.fingerprint}`);
        } else {
            log(`error updating prediction for ${fingerprint} to ${prediction} for ${this.fingerprint} - ${response}`);
            throw `error updating prediction for ${fingerprint} to ${prediction} for ${this.fingerprint}`;
        }
    }

    predict(input) {
        if (!this.nn) { throw "expected neural network to be trained to predict" }
        if (this.isDirty) {
            log(`warning: neural network is dirty and needs to be re-trained to reflect most recent classifications`);
        }

        const prediction = this.nn.run(input)[0];

        if (isNaN(prediction)) { throw "inputs gave NaN prediction" }

        return prediction;
    }

    reset() {
        this.nn = null;
        this.isDirty = true;
        this.normalizationMetadata = {};
        this.classifications = {};
        this.data = [];
        this.trainingData = [];
        this.trainedDate = null;
        this.fingerprint = `${this.name}:${Object.keys(this.classifications).length}`;
    }

    createNeuralNetwork(options=null) {
        if (!options) {
            options = this.networkOptions;
        }

        log(`creating new neural network with options ${JSON.stringify(options)}`);
        return new brain.NeuralNetwork(options);
    }

    async toJSON() {
        let classifications = {}, neuralnetwork = null;

        if (this.nn && this.classifications) {
            classifications = await this.classifier.getClassificationMapping(this.classifications);
            neuralnetwork = this.nn.toJSON();
        }

        const trainingOptions = this.trainingOptions;
        delete trainingOptions["callback"];

        return {
            fingerprint: this.fingerprint,
            name: this.fingerprint,
            networkOptions: this.networkOptions,
            trainingOptions,
            scraper: this.scraper.constructor.name,
            extractor: this.extractor.constructor.name,
            normalizer: this.normalizer.constructor.name,
            classifier: this.classifier.name,
            network: BrainNeuralNetwork.name,
            neuralnetwork,
            classifications,
            normalizationMetadata: this.normalizationMetadata,
            trainingData: this.trainingData,
            trainedDate: this.trainedDate,
            createdDate: new Date(),
        }
    }

    async save() {
        const obj = await this.toJSON();
        if (!obj.fingerprint) { throw "expected fingerprint" }

        const db = await database(BrainNeuralNetwork.getDatabaseName());
        try {
            const response = await db.collection(BrainNeuralNetwork.getCollectionName()).insertOne(obj);
            if (!utils.ok(response)) {
                throw "invalid response"
            }

            log(`successfully saved network ${obj.fingerprint}`);

            return obj;
        } catch (e) {
            log(`error saving network ${obj.fingerprint} - ${e}`);
            throw e;
        } finally {
            db.close();
        }
    }

    // DEPRECATE
    static async updateFingerprint(db, oldFingerprint, newFingerprint) {
        try {
            const response = await db.collection(BrainNeuralNetwork.getCollectionName()).updateOne({ fingerprint: oldFingerprint }, {
                "$set": {
                    fingerprint: newFingerprint
                }
            });

            if (!utils.ok(response)) {
                throw "invalid response"
            }

            log(`successfully updated ${oldFingerprint} to ${newFingerprint}`);
            return true;
        } catch (e) {
            log(`error updating network ${oldFingerprint} - ${e}`);
            throw e;
        }
    }


    static async getFromFingerprint(fingerprint) {
        const db = await database(BrainNeuralNetwork.getDatabaseName());
        const network = await db.collection(BrainNeuralNetwork.getCollectionName()).findOne({ fingerprint });
        if (!network) { throw `error finding network with fingerprint ${fingerprint}` }

        return network;
    }

    static getDefaultNeuralNetworkOptions() {
        return {
            binaryThresh: 0.5,
            hiddenLayers: [20, 10],
            activation: 'tanh',
        };
    }

    static getDefaultTrainingOptions() {
        /*
            iterations: 20000,    // the maximum times to iterate the training data --> number greater than 0
            errorThresh: 0.005,   // the acceptable error percentage from training data --> number between 0 and 1
            log: false,           // true to use console.log, when a function is supplied it is used --> Either true or a function
            logPeriod: 10,        // iterations between logging out --> number greater than 0
            learningRate: 0.3,    // scales with delta to effect training rate --> number between 0 and 1
            momentum: 0.1,        // scales with next layer's change value --> number between 0 and 1
            callback: null,       // a periodic call back that can be triggered while training --> null or function
            callbackPeriod: 10,   // the number of iterations through the training data between callback calls --> number greater than 0
            timeout: Infinity
        */

        return {
            iterations: 10000,
            errorThresh: 0.005,
            callback: (stats={}) => {
                log(`training iterations=${stats.iterations} error=${stats.error} for ${this.name}`);
            },
            callbackPeriod: 500,
            timeout: (30 * 1000),
        }
    }

    static getCollectionName() {
        return config.networksCollectionName;
    }

    static getPredictionsCollectionName() {
        return config.predictionsCollectionName;
    }

    static getDatabaseName() {
        return config.databaseName;
    }

    static async createIndexes(db) {
        await db.collection(this.getCollectionName()).createIndex({ "fingerprint": 1 }, {"unique": true});
        await db.collection(this.getPredictionsCollectionName()).createIndex({ "classifier": 1, "network_fingerprint": 1, "content_fingerprint": 1 }, {"unique": true});
        await db.collection(this.getPredictionsCollectionName()).createIndex({ "predictions": 1 });
    }

    static async getDatabase() {
        return await database(this.getDatabaseName());
    }

    static async resetDatabase() {
        const db = await database(this.getDatabaseName());
        await db.collection(this.getCollectionName()).deleteMany({});
        await db.collection(this.getPredictionsCollectionName()).deleteMany({});
        await BrainNeuralNetwork.createIndexes(db);
        db.close();
    }
}
