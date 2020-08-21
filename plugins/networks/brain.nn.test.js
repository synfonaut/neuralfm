const fs = require("fs");
const assert = require("assert");
const core = require("../../core");
const scrapersCore = require("../../core/scrapers");
const plugins = require("../index");
const utils = require("../../utils");
const helpers = require("../../helpers");

const StandardFeatureNormalizer = plugins.normalizers.StandardFeatureNormalizer;

plugins.networks.BrainNeuralNetwork._getDatabaseName = plugins.networks.BrainNeuralNetwork.getDatabaseName;
plugins.networks.BrainNeuralNetwork.getDatabaseName = function() {
  if (plugins.networks.BrainNeuralNetwork._getDatabaseName().indexOf("Test") !== 0) {
    return `Test${plugins.networks.BrainNeuralNetwork._getDatabaseName()}`;
  }
  return plugins.networks.BrainNeuralNetwork._getDatabaseName();
}

describe.only("brain neural network", function () {
    this.timeout(10000);
    this.slow(1000);

    beforeEach(async function() {
      await helpers.setupTestDatabase();
    });

    it("verifies plugins loaded properly", function() {
        assert(plugins.networks.BrainNeuralNetwork);
    });

    it("initializes default neural network", async function() {
        const db = await core.db(plugins.scrapers.BSVTwitterScraper.getDatabaseName());
        const scraper = new plugins.scrapers.BSVTwitterScraper(db);
        const extractor = new plugins.extractors.TwitterFeatureExtractor(db, scraper);
        const normalizer = new StandardFeatureNormalizer(db, scraper, extractor);
        const classifications = [];

        const network = new plugins.networks.BrainNeuralNetwork(scraper, extractor, normalizer, classifications);
        assert(network);

        assert.deepEqual(network.networkOptions, {
            binaryThresh: 0.5,
            hiddenLayers: [20, 10],
            activation: 'tanh',
        });

        assert(network.trainingOptions);
        assert.equal(network.trainingOptions.iterations, 10000);
        assert.equal(network.trainingOptions.errorThresh, 0.005);
    });

    it("converts normalized and classification data to nn data", async function() {
        this.timeout(20000);
        this.slow(5000);

        const db = await core.db(plugins.scrapers.BSVTwitterScraper.getDatabaseName());
        const scraper = new plugins.scrapers.BSVTwitterScraper(db);
        const extractor = new plugins.extractors.TwitterFeatureExtractor(db, scraper);
        const normalizer = new StandardFeatureNormalizer(db, scraper, extractor);

        await scraper.run();
        await extractor.run();
        await normalizer.run();

        const classifier = new core.classifiers.Classifier("test_classifier");
        await classifier.classify("twitter-1293919071222849500", 1);

        const classifications = await classifier.getClassifications();
        assert.equal(classifications.length, 1);

        const trainingData = await normalizer.getTrainingData(classifier);
        assert.equal(trainingData.length, 1);

        assert.equal(trainingData[0].fingerprint, "twitter-1293919071222849500");
        assert.equal(trainingData[0].input.length, 277);
        assert.equal(trainingData[0].output[0], 1);
    });

    it("trains basic neural network", async function() {
        this.timeout(20000);
        this.slow(5000);

        const db = await core.db(plugins.scrapers.BSVTwitterScraper.getDatabaseName());
        const scraper = new plugins.scrapers.BSVTwitterScraper(db);
        const extractor = new plugins.extractors.TwitterFeatureExtractor(db, scraper);
        const normalizer = new StandardFeatureNormalizer(db, scraper, extractor);

        await scraper.run();
        await extractor.run();
        await normalizer.run();

        const classifier = new core.classifiers.Classifier("test_classifier");
        await classifier.classify("twitter-1293919071222849500", 1);

        const network = new plugins.networks.BrainNeuralNetwork(scraper, extractor, normalizer, classifier);
        assert(network);
        assert.equal(network.isDirty, true);
        //assert.equal(network.name, "BSVTwitterScraper:TwitterFeatureExtractor:StandardFeatureNormalizer:test_classifier");
        assert.equal(network.name, "BTS:TFE:SFN:test_classifier");

        await core.networks.train(network);
        assert(network.nn);
        assert.equal(network.isDirty, false);

        const fieldName = StandardFeatureNormalizer.getNormalizedFieldName(extractor);

        const rows = await normalizer.getDataSource();
        for (const row of rows) {
            const input = StandardFeatureNormalizer.convertToTrainingDataInput(row[fieldName]);
            for (const val of input) {
                assert(val >= -1);
                assert(val <= 1);
            }

            const output = network.predict(input);
            assert(output > 0);
        }
    });

  it("saves and loads neural network", async function() {
    this.timeout(20000);
    this.slow(5000);

    const db = await core.db(plugins.scrapers.BSVTwitterScraper.getDatabaseName());
    const scraper = new plugins.scrapers.BSVTwitterScraper(db);
    const extractor = new plugins.extractors.TwitterFeatureExtractor(db, scraper);
    const normalizer = new StandardFeatureNormalizer(db, scraper, extractor);

    await scraper.run();
    await extractor.run();
    await normalizer.run();

    const classifier = new core.classifiers.Classifier("test_classifier");
    await classifier.classify("twitter-1293919071222849500", 1);

    const network = new plugins.networks.BrainNeuralNetwork(scraper, extractor, normalizer, classifier);
    await core.networks.train(network);

    const savedNetwork = await network.save();
    assert(savedNetwork);
    assert(savedNetwork.fingerprint);

    const newNetwork = await core.networks.load(savedNetwork.fingerprint);
    assert(newNetwork);

    const fieldName = StandardFeatureNormalizer.getNormalizedFieldName(newNetwork.extractor);

    const rows = await newNetwork.normalizer.getDataSource();

    let found = false;
    for (const row of rows) {
      const input = StandardFeatureNormalizer.convertToTrainingDataInput(row[fieldName]);
      for (const val of input) {
        assert(val >= -1);
        assert(val <= 1);
      }

      const output = network.predict(input);
      assert(output > 0);
      found = true;
    }

    assert(found);
  });

  it("saves prediction on data object", async function() {
    this.timeout(20000);
    this.slow(5000);

    const db = await core.db(plugins.scrapers.BSVTwitterScraper.getDatabaseName());
    const scraper = new plugins.scrapers.BSVTwitterScraper(db);
    const extractor = new plugins.extractors.TwitterFeatureExtractor(db, scraper);
    const normalizer = new StandardFeatureNormalizer(db, scraper, extractor);

    await scraper.run();
    await extractor.run();
    await normalizer.run();

    const classifier = new core.classifiers.Classifier("test_classifier");
    await classifier.classify("twitter-1293919071222849500", 1);

    const network = new plugins.networks.BrainNeuralNetwork(scraper, extractor, normalizer, classifier);
    await core.networks.train(network);

    await core.networks.calculate(network);

    const data = await network.getDataSource();
    let found = false;
    for (const row of data) {
      assert(row.predictions);
      assert(row.predictions[network.fingerprint]);
      assert(row.predictions[network.fingerprint] > 0);
      found = true;
    }
    assert(found);
  });

  // create prediction table

  it("filters normalizer data source on network prediction", async function() {
    this.timeout(20000);
    this.slow(5000);

    const db = await core.db(plugins.scrapers.BSVTwitterScraper.getDatabaseName());
    const scraper = new plugins.scrapers.BSVTwitterScraper(db);
    const extractor = new plugins.extractors.TwitterFeatureExtractor(db, scraper);
    const normalizer = new StandardFeatureNormalizer(db, scraper, extractor);

    await scraper.run();
    await extractor.run();
    await normalizer.run();

    const classifier = new core.classifiers.Classifier("test_classifier");
    await classifier.classify("twitter-1293919071222849500", 1);

    const network = new plugins.networks.BrainNeuralNetwork(scraper, extractor, normalizer, classifier);
    await core.networks.train(network);

    await core.networks.calculate(network);

    const data = await network.getDataSource();
    let found = false;
    for (const row of data) {
      assert(row.predictions);
      assert(row.predictions[network.fingerprint]);
      assert(row.predictions[network.fingerprint] > 0);
      found = true;
    }
    assert(found);

    const results = await network.getDataSource("created_at", 1, 0.9);
    assert(results);
    assert(results.length > 0);
    assert(results.length < data.length);
  });

});

