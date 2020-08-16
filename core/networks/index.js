const log = require("debug")("neuralfm:core:network");
const database = require("../db").db;
const config = require("../../config");
const brain = require("brain.js");

const Classifier = require("../classifiers").Classifier;

const plugins = require("../../plugins");


export async function train(network) {
    log(`training ${network.name}`);
    await network.run();
    await network.calculate();
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

    if (data.neuralnetwork) {
        const nn = networkInstance.createNeuralNetwork(networkOptions);
        nn.fromJSON(data.neuralnetwork);
        networkInstance.nn = nn;
        networkInstance.isDirty = false;
    } else {
        networkInstance.nn = null;
        networkInstance.isDirty = true;
    }

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
    return await network.save();
}

export async function getAllNetworks() {
    log(`getting all networks`);
    const db = await database(config.databaseName);

    const networks = (await db.collection(config.networkCollectionName).find({}).sort({"order": -1})).toArray();

    db.close();

    return networks;
}

export async function calculate(network) {
    await network.calculate();
}

export async function create(scraper, extractor, normalizer, network, classifier) {
    if (!scraper) { throw "expected scraper" }
    if (!extractor) { throw "expected extractor" }
    if (!normalizer) { throw "expected normalizer" }
    if (!network) { throw "expected network" }
    if (!classifier) { throw "expected name" }

    const scraperDatabase = await database(scraper.getDatabaseName());
    const scraperInstance = new scraper(scraperDatabase);
    const extractorInstance = new extractor(scraperDatabase, scraperInstance);
    const normalizerInstance = new normalizer(scraperDatabase, scraperInstance, extractorInstance);
    const classifierInstance = new Classifier(classifier);

    const defaultNetworkOptions = network.getDefaultNeuralNetworkOptions();
    const networkInstance = new network(scraperInstance, extractorInstance, normalizerInstance, classifierInstance, defaultNetworkOptions);

    return await save(networkInstance);
}

export async function createIndexes() {
    const db = await database(config.databaseName);
    await db.collection(config.networkCollectionName).createIndex({"fingerprint": 1}, {"unique": true});
    await db.collection(config.networkCollectionName).createIndex({"name": 1}, {"unique": true});
    db.close();
}

if (require.main === module) {
    (async function() {

        await createIndexes();

        const networks = await getAllNetworks();
        console.log("NETWORKS", networks);
        /*
        let results;
        do {
            results = await extract(allExtractors);
            if (results.length > 0) {
                log("sleeping");
                await utils.sleep(1000);
            }
        } while (results.length > 0);

        */
        process.exit();
    })();

}