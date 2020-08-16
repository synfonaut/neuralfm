const fs = require("fs");
const assert = require("assert");
const core = require("../../core");
const scrapersCore = require("../../core/scrapers");
const utils = require("../../utils");

describe("extract features", function () {
    beforeEach(async function() {
        const scrapers = scrapersCore.getCompatible(core.plugins.extractors.TwitterFeatureExtractor);
        assert(scrapers && scrapers.length > 0);
        const fixtures = JSON.parse(fs.readFileSync("./plugins/extractors/fixtures.json", "utf8"));
        for (const scraper of scrapers) {
            const databaseName = await scraper.getDatabaseName();
            assert.equal(databaseName.indexOf("Test"), 0);

            const db = await core.db(databaseName);

            await scraper.resetDatabase();
            await core.plugins.normalizers.StandardFeatureNormalizer.resetDatabase(databaseName);

            response = await db.collection(scraper.getCollectionName()).insertMany(fixtures);
            const results = await db.collection(scraper.getCollectionName()).find({}).toArray();
            assert.equal(results.length, 10);
        }
    });

    it("default plugins load properly", function () {
        const plugins = core.plugins;
        assert(plugins);

        const BSVTwitterScraper = plugins.scrapers.BSVTwitterScraper;
        assert(BSVTwitterScraper);

        const TwitterFeatureExtractor = plugins.extractors.TwitterFeatureExtractor;
        assert(TwitterFeatureExtractor);

        assert(scrapersCore.isCompatible(BSVTwitterScraper, TwitterFeatureExtractor));
        assert.deepEqual(scrapersCore.getCompatible(TwitterFeatureExtractor), [BSVTwitterScraper]);
    });

    it("extract features from data", async function() {
        this.timeout(5000);
        this.slow(1000);

        let extractors = [core.plugins.extractors.TwitterFeatureExtractor];
        let results;

        results = await core.extractors.extract(extractors);
        assert.equal(results.length, 10);
        assert(results[0].twitter_features);

        results = await core.extractors.extract(extractors);
        assert.equal(results.length, 0);
    });
});

