const log = require("debug")("neuralfm:plugins:networks:brainnn");
const brain = require("brain.js");

// easy to save snapshotted versions
// load network config
// load training config
//
// networks -> plugins

// is cancelable 
// training is async and can provide update to ui progress bar

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

        this.nn = null;

        this.isDirty = true;

        this.trainingOptions = (opts.trainingOptions ? opts.trainingOptions : BrainNeuralNetwork.getDefaultTrainingOptions());
        this.networkOptions = (opts.networkOptions ? opts.networkOptions : BrainNeuralNetwork.getDefaultNeuralNetworkOptions());

        this.name = `${this.scraper.constructor.name}:${this.extractor.constructor.name}:${this.normalizer.constructor.name}:${this.classifier.name}`;
    }

    async run() {
        const classifications = await this.classifier.getClassifications();
        if (classifications.length == 0) {
            log(`no classifications to train ${this.name}`);
            return;
        }

        const data = await this.normalizer.getDataSource();

        const normalizationMetadata = await this.normalizer.getOrCreateMetadata(data);

        if (this.nn) {
            log(`reusing existing neural network`);
        } else {
            this.nn = this.createNeuralNetwork();
        }

        const trainingData = await this.normalizer.getTrainingData(this.classifier, data);

        log(`training ${this.name} on ${trainingData.length} classifications (${data.length} data)`);
        const starttime = Date.now();
        this.nn.train(trainingData, this.trainingOptions);
        const endtime = Date.now();
        log(`finished training ${this.name} in ${(endtime-starttime) / 1000}s`);

        this.isDirty = false;
    }

    predict(input) {
        if (!this.nn) { throw "expected neural network to be trained to predict" }
        if (this.isDirty) {
            log(`warning: neural network is dirty and needs to be re-trained to reflect most recent classifications`);
        }

        return this.nn.run(input)[0];
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

    createNeuralNetwork() {
        log(`creating new neural network with options ${JSON.stringify(this.networkOptions)}`);
        return new brain.NeuralNetwork(this.networkOptions);
    }

    static getDefaultNeuralNetworkOptions() {
        return {
            binaryThresh: 0.5,
            hiddenLayers: [10, 5],
            activation: 'sigmoid',
        };
    }
}
