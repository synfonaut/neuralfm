const log = require("debug")("neuralfm:plugins:networks:brainnn");
const config = require("../../config");
const utils = require("../../utils");
const database = require("../../core/db").db;

const brain = require("brain.js");

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

        this.name = `${this.scraper.constructor.name}:${this.extractor.constructor.name}:${this.normalizer.constructor.name}:${this.classifier.name}`;
        this.nn = null;
        this.isDirty = true;
        this.normalizationMetadata = {};
        this.classifications = {};
        this.data = [];
        this.trainingData = [];
        this.trainedDate = null;
        this.fingerprint = `${this.name}:${Object.keys(this.classifications).length}`;

        this.trainingOptions = (opts.trainingOptions ? opts.trainingOptions : BrainNeuralNetwork.getDefaultTrainingOptions());
        this.networkOptions = (opts.networkOptions ? opts.networkOptions : BrainNeuralNetwork.getDefaultNeuralNetworkOptions());
    }

    async run() {
        this.classifications = await this.classifier.getClassifications();
        if (Object.keys(this.classifications).length == 0) {
            log(`no classifications to train ${this.name}`);
            return;
        }

        this.data = await this.normalizer.getDataSource();

        this.normalizationMetadata = await this.normalizer.getOrCreateMetadata(this.data);

        if (this.nn) {
            log(`reusing existing neural network`);
        } else {
            this.nn = this.createNeuralNetwork();
        }

        this.trainingData = await this.normalizer.getTrainingData(this.classifier, this.data);

        log(`training ${this.name} on ${this.trainingData.length} classifications (${this.data.length} data)`);
        const starttime = Date.now();
        this.nn.train(this.trainingData, this.trainingOptions);
        const endtime = Date.now();
        log(`finished training ${this.name} in ${(endtime-starttime) / 1000}s`);

        this.isDirty = false;
        this.trainedDate = new Date();
        this.fingerprint = `${this.name}:${Object.keys(this.classifications).length}:${this.trainedDate.getTime()}`;
    }

    async calculate() {
        if (!this.nn) { throw "expected neural network" }
        if (!this.data || this.data.length === 0) { throw "expected data" }

        log(`calculating predictions for ${this.fingerprint} on ${this.data.length} data`);

        const normalizedFieldName = this.normalizer.constructor.getNormalizedFieldName(this.extractor);
        for (const row of this.data) {
            const normalizedData = row[normalizedFieldName];
            const input = this.normalizer.constructor.convertToTrainingDataInput(normalizedData);
            const prediction = this.predict(input);
            await this.updatePrediction(row.fingerprint, prediction);
        }

        log(`updated predictions for ${this.fingerprint} on ${this.data.length} data`);
    }

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
            log(`created prediction for ${fingerprint} to ${prediction} for ${this.fingerprint}`);
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

        return {
            fingerprint: this.fingerprint,
            name: this.fingerprint,
            networkOptions: this.networkOptions,
            trainingOptions: this.trainingOptions,
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

            return obj.fingerprint;
        } catch (e) {
            log(`error saving network ${obj.fingerprint} - ${e}`);
            throw e;
        } finally {
            db.close();
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
            hiddenLayers: [10, 5],
            activation: 'sigmoid',
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
            callbackPeriod: 100,
        }
    }

    static getCollectionName() {
        return config.networkCollectionName;
    }

    static getDatabaseName() {
        return config.databaseName;
    }

    static async createIndexes(db) {
        await db.collection(this.getCollectionName()).createIndex({ "fingerprint": 1 }, {"unique": true});
    }

    static async resetDatabase() {
        const db = await database(this.getDatabaseName());
        await db.collection(this.getCollectionName()).deleteMany({});
        await BrainNeuralNetwork.createIndexes(db);
        db.close();
    }
}
