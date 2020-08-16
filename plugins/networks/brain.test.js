const fs = require("fs");
const assert = require("assert");
const core = require("../../core");
const scrape = require("../../core/scrape");
const plugins = require("../index");
const utils = require("../../utils");

// easy to store in database
//  trains
//  easily morphable for frontend UI


// Network
// - networkOptions
// - trainingOptions
// - network used
// - classifications used
// - normalized used
// - features used
// - dataset used
// - created date

describe.skip("brain neural network", function () {
    this.timeout(10000);
    this.slow(1000);

    beforeEach(async function() {
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

            db.close();
        }
    });

    it("verifies plugins loaded properly", function() {
        assert(plugins.networks.BrainNeuralNetwork);
    });

    it("initializes default neural network", async function() {
        const db = await core.db(plugins.scrapers.BSVTwitterScraper.getDatabaseName());
        const scraper = new plugins.scrapers.BSVTwitterScraper(db);
        const extractor = new plugins.extractors.TwitterFeatureExtractor(db, scraper);
        const normalizer = new plugins.normalizers.StandardFeatureNormalizer(db, scraper, extractor);
        const classifications = [];

        const network = new plugins.networks.BrainNeuralNetwork(scraper, extractor, normalizer, classifications);
        assert(network);

        assert.deepEqual(network.networkOptions, {
            binaryThresh: 0.5,
            hiddenLayers: [10, 5],
            activation: 'sigmoid',
        });

        assert.deepEqual(network.trainingOptions, {
            iterations: 10000,
            errorThresh: 0.005,
            log: true,
            logPeriod: 500,
        });
    });

    it.skip("trains basic neural network", async function() {
        this.timeout(20000);
        this.slow(5000);

        const db = await core.db(plugins.scrapers.BSVTwitterScraper.getDatabaseName());
        const scraper = new plugins.scrapers.BSVTwitterScraper(db);
        const extractor = new plugins.extractors.TwitterFeatureExtractor(db, scraper);
        const normalizer = new plugins.normalizers.StandardFeatureNormalizer(db, scraper, extractor);

        await scraper.run();
        await extractor.run();
        await normalizer.run();

        /*
        core.Classifier("test_classifier");
        */

        /*
        const classifications = [
            {"fingerprint": "twitter-1294363849961820200", "classification": 1},
        ];

        const network = new plugins.networks.BrainNeuralNetwork(scraper, extractor, normalizer, classifications);
        assert(network);
        */
    });

});

