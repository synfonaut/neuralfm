const fs = require("fs");
const assert = require("assert");
const core = require("../../core");
const utils = require("../../utils");

//import { TwitterFeatureExtractor } from "../extract/twitter"

// bag of words // td ifs

describe.only("extract features", function () {

    before(async function() {
        /*
        const scraper = TestExtractor.getScrapers()[0];
        const db = await scraper.getDatabaseName();
        const fixtures = JSON.parse(fs.readFileSync("./core/extract/fixtures.json", "utf8"));
        */
        /*
        for (const scraper of TestExtractor.getScrapers()) {
            const db = await core.db(scraper.getDatabaseName());
        }
        */
        console.log("DB");


        /*
        let response = await db.collection(TestScraper.collectionName).deleteMany({});
        assert(response);
        assert(response.result);
        assert(response.result.ok);
        */
    });

    it.only("default plugins load properly", function () {
        const plugins = core.plugins;
        assert(plugins);

        const BSVTwitterScraper = plugins.scrapers.BSVTwitterScraper;
        assert(BSVTwitterScraper);

        const TwitterFeatureExtractor = plugins.extractors.TwitterFeatureExtractor;
        assert(TwitterFeatureExtractor);

        assert(core.scrape.isCompatible(BSVTwitterScraper, TwitterFeatureExtractor));
        assert.deepEqual(core.scrape.getCompatible(TwitterFeatureExtractor), [BSVTwitterScraper]);
    });

    it("fixtures load data properly", async function() {
    });

    it.skip("extract features from data", async function() {
        const data = [
            getDummyTwitterDataSource(0),
            getDummyTwitterDataSource(1),
            getDummyTwitterDataSource(2),
        ];

        // Normalizers are code running objects...that update objects to have a normalized object
        // WHere is the minMax information stored?
        let normalizers = [TestNormalizer];
        let results;

        results = await core.normalize(normalizers);
        console.log("RESULTS", results);
    });
});

