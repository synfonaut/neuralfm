const fs = require("fs");
const assert = require("assert");
const core = require("../index");
const scrape = require("../../core/scrape");
const utils = require("../../utils");

describe("network", function () {
  this.timeout(5000);
  this.slow(1000);

  beforeEach(async function() {
      const networks = Object.values(core.plugins.networks);
      for (const network of networks) {
          await network.resetDatabase();
      }

      const scrapers = scrape.getCompatible(core.plugins.extractors.TwitterFeatureExtractor);
      assert(scrapers && scrapers.length > 0);
      const fixtures = JSON.parse(fs.readFileSync("./plugins/extractors/fixtures.json", "utf8"));
      for (const scraper of scrapers) {
          const databaseName = await scraper.getDatabaseName();
          assert.equal(databaseName.indexOf("Test"), 0);
          const db = await core.db(databaseName);

          await scraper.resetDatabase();
          await core.plugins.normalizers.StandardFeatureNormalizer.resetDatabase(databaseName);
          await core.Classifier.resetDatabase();

          await db.collection(scraper.getCollectionName()).insertMany(fixtures);
          const results = await db.collection(scraper.getCollectionName()).find({}).toArray();
          assert.equal(results.length, 10);

          await core.plugins.networks.BrainNeuralNetwork.resetDatabase();

          await core.network.createIndexes();

          db.close();
      }
  });

  it("gets all networks", async function() {
    const db = await core.db(core.plugins.scrapers.BSVTwitterScraper.getDatabaseName());
    const scraper = new core.plugins.scrapers.BSVTwitterScraper(db);
    const extractor = new core.plugins.extractors.TwitterFeatureExtractor(db, scraper);
    const normalizer = new core.plugins.normalizers.StandardFeatureNormalizer(db, scraper, extractor);

    await scraper.run();
    await extractor.run();
    await normalizer.run();

    const classifier = new core.Classifier("test_classifier");
    await classifier.classify("twitter-1294363849961820200", 1);

    const network = new core.plugins.networks.BrainNeuralNetwork(scraper, extractor, normalizer, classifier);
    await core.train(network);

    const fingerprint1 = await network.save();
    assert(fingerprint1);


    await core.train(network);
    const fingerprint2 = await network.save();
    assert(fingerprint2);

    const networks = await core.network.getAllNetworks();
    assert.equal(networks.length, 2);
  });

  it("creates a new network with options", async function() {
    const scraper = core.plugins.scrapers.BSVTwitterScraper;
    const extractor = core.plugins.extractors.TwitterFeatureExtractor;
    const normalizer = core.plugins.normalizers.StandardFeatureNormalizer;
    const network = core.plugins.networks.BrainNeuralNetwork;
    const classifier = "test neural network name";

    const fingerprint = await core.create(scraper, extractor, normalizer, network, classifier);
    assert.equal(fingerprint, "BSVTwitterScraper:TwitterFeatureExtractor:StandardFeatureNormalizer:test neural network name:0");

    const networkInstance = await core.load(fingerprint);
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

    await core.train(networkInstance);

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

