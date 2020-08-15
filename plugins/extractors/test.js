const fs = require("fs");
const assert = require("assert");
const core = require("../../core");
const scrape = require("../../core/scrape");
const utils = require("../../utils");

describe("extract features", function () {

    before(async function() {
        const scrapers = scrape.getCompatible(core.plugins.extractors.TwitterFeatureExtractor);
        assert(scrapers && scrapers.length > 0);
        const fixtures = JSON.parse(fs.readFileSync("./plugins/extractors/fixtures.json", "utf8"));
        for (const scraper of scrapers) {
            const databaseName = await scraper.getDatabaseName();
            assert.equal(databaseName.indexOf("Test"), 0);

            const db = await core.db(databaseName);
            let response = await db.collection(scraper.getCollectionName()).deleteMany({});
            assert(response);
            assert(response.result);
            assert(response.result.ok);


            response = await db.collection(scraper.getCollectionName()).insertMany(fixtures);
            assert(response);
            assert(response.result);
            assert(response.result.ok);

            const results = await db.collection(scraper.getCollectionName()).find({}).toArray();
            assert(results);
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

        assert(scrape.isCompatible(BSVTwitterScraper, TwitterFeatureExtractor));
        assert.deepEqual(scrape.getCompatible(TwitterFeatureExtractor), [BSVTwitterScraper]);
    });

    it("extract features from data", async function() {
        this.timeout(5000);
        this.slow(1000);

        let extractors = [core.plugins.extractors.TwitterFeatureExtractor];
        let results;

        results = await core.extract(extractors);
        assert.equal(results.length, 10);
        assert(results[0].twitter_features);

        results = await core.extract(extractors);
        assert.equal(results.length, 0);
    });
});

