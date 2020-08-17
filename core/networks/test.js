const assert = require("assert");
const core = require("../index");
const scrapersCore = require("../scrapers");
const utils = require("../../utils");
const helpers = require("../../helpers");

describe("network", function () {
  this.timeout(5000);
  this.slow(1000);

  beforeEach(async function() {
    await helpers.setupTestDatabase();
  });

  it("gets all networks", async function() {
    const db = await core.db(core.plugins.scrapers.BSVTwitterScraper.getDatabaseName());
    const scraper = new core.plugins.scrapers.BSVTwitterScraper(db);
    const extractor = new core.plugins.extractors.TwitterFeatureExtractor(db, scraper);
    const normalizer = new core.plugins.normalizers.StandardFeatureNormalizer(db, scraper, extractor);

    await scraper.run();
    await extractor.run();
    await normalizer.run();

    const classifier = new core.classifiers.Classifier("test_classifier");
    await classifier.classify("twitter-1294363849961820200", 1);

    const network = new core.plugins.networks.BrainNeuralNetwork(scraper, extractor, normalizer, classifier);
    await core.networks.train(network);

    const networkInstance1 = await network.save();
    assert(networkInstance1.fingerprint);


    await core.networks.train(network);
    const networkInstance2 = await network.save();
    assert(networkInstance2.fingerprint);

    const networks = await core.networks.getAllNetworks();
    assert.equal(networks.length, 2);
  });

  it("creates a new network with options", async function() {
    const scraper = core.plugins.scrapers.BSVTwitterScraper;
    const extractor = core.plugins.extractors.TwitterFeatureExtractor;
    const normalizer = core.plugins.normalizers.StandardFeatureNormalizer;
    const network = core.plugins.networks.BrainNeuralNetwork;
    const classifier = "test neural network name";

    const oldNetworkInstance = await core.networks.create(scraper, extractor, normalizer, network, classifier);
    assert.equal(oldNetworkInstance.fingerprint, "BSVTwitterScraper:TwitterFeatureExtractor:StandardFeatureNormalizer:test neural network name:0");

    const networkInstance = await core.networks.load(oldNetworkInstance.fingerprint);
    assert(networkInstance);
    assert.equal(scraper.name, networkInstance.scraper.constructor.name);
    assert.equal(extractor.name, networkInstance.extractor.constructor.name);
    assert.equal(normalizer.name, networkInstance.normalizer.constructor.name);
    assert.equal(network.name, networkInstance.constructor.name);
    assert.equal(classifier, networkInstance.classifier.name);

    await networkInstance.scraper.run();
    await networkInstance.extractor.run();
    await networkInstance.normalizer.run();

    await networkInstance.classifier.classify("twitter-1294363849961820200", 1);

    await core.networks.train(networkInstance);

    const results = await networkInstance.normalizer.getDataSource();
    let found = false;
    for (const result of results) {
      const prediction = result.predictions[networkInstance.fingerprint];
      assert(prediction > 0.8);
      found = true;
    }
    assert(found);
  });
});

