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
});

