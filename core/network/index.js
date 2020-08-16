const log = require("debug")("neuralfm:core:train");
const database = require("../db").db;
const config = require("../../config");
const brain = require("brain.js");

const Classifier = require("../classify").Classifier;

const plugins = require("../../plugins");


export async function train(network) {
    log(`training ${network.name}`);
    await network.run();
}

export async function load(fingerprint) {
    log(`loading network ${fingerprint}`);

    const db = await database(config.databaseName);
    const data = await db.collection(config.networkCollectionName).findOne({});
    if (!data) { throw `error finding data with fingerprint ${fingerprint}` }

    const scraper = plugins.scrapers[data.scraper];
    if (!scraper) { throw `error finding scraper ${data.scraper} for fingerprint ${fingerprint}` }

    const extractor = plugins.extractors[data.extractor];
    if (!extractor) { throw `error finding extractor ${data.extractor} for fingerprint ${fingerprint}` }

    const normalizer = plugins.normalizers[data.normalizer];
    if (!normalizer) { throw `error finding normalizer ${data.normalizer} for fingerprint ${fingerprint}` }

    const network = plugins.networks[data.network];
    if (!network) { throw `error finding network ${data.network} for fingerprint ${fingerprint}` }

    if (!data.classifier) { throw `expected classifier for fingerprint ${fingerprint}` }
    if (!data.networkOptions) { throw `expected networkOptions for fingerprint ${fingerprint}` }
    if (!data.trainingOptions) { throw `expected trainingOptions for fingerprint ${fingerprint}` }
    if (!data.normalizationMetadata) { throw `expected normalizationMetadata for fingerprint ${fingerprint}` }
    if (!data.classifications) { throw `expected classifications for fingerprint ${fingerprint}` }
    if (data.fingerprint !== fingerprint) { throw `expected fingerprint ${data.fingerprint} to match ${fingerprint}` }

    const scraperDatabase = await database(scraper.getDatabaseName());

    const scraperInstance = new scraper(scraperDatabase);
    const extractorInstance = new extractor(scraperDatabase, scraperInstance);
    const normalizerInstance = new normalizer(scraperDatabase, scraperInstance, extractorInstance);
    const classifierInstance = new Classifier(data.classifier);
    const networkOptions = data.networkOptions;
    const trainingOptions = data.trainingOptions;

    // functions don't serialize
    const defaultTrainingOptions = network.getDefaultTrainingOptions();
    trainingOptions.callback = defaultTrainingOptions.callback;

    const options = {
        networkOptions,
        trainingOptions,
    };

    const networkInstance = new network(scraperInstance, extractorInstance, normalizerInstance, classifierInstance, options);

    const nn = networkInstance.createNeuralNetwork(networkOptions);
    nn.fromJSON(data.neuralnetwork);

    networkInstance.nn = nn;
    networkInstance.isDirty = false;
    networkInstance.normalizationMetadata = data.normalizationMetadata;
    networkInstance.classifications = data.classifications;
    networkInstance.data = data.data;
    networkInstance.trainingData = data.trainingData;
    networkInstance.trainedDate = data.trainedDate;
    networkInstance.fingerprint = data.fingerprint;

    log(`loaded neural network ${networkInstance.fingerprint}`);

    db.close();
    scraperDatabase.close();

    return networkInstance;
}

export async function save(network) {
    log(`saving network ${network.fingerprint}`);
    await network.save();
}

