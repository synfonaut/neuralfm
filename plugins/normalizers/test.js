const fs = require("fs");
const assert = require("assert");
const core = require("../../core");
const scrape = require("../../core/scrape");
const utils = require("../../utils");

import { minmax, wordvector, bagofwords } from "./standard"

describe("normalize features", function () {

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

        const StandardFeatureNormalizer = plugins.normalizers.StandardFeatureNormalizer;
        assert(StandardFeatureNormalizer);
    });

    it("minmax reliably detects limits", function () {
        assert.deepEqual(minmax([0, 0, 0, 0]), [0, 0]);
        assert.deepEqual(minmax([1, 1, 1, 1]), [1, 1]);
        assert.deepEqual(minmax([2, 2, 2, 2]), [2, 2]);
        assert.deepEqual(minmax([1, 2, 3, 4]), [1, 4]);
        assert.deepEqual(minmax([2, 2, 2, 2], null, 1), [1, 1]);
        assert.deepEqual(minmax([-100, 100], 0, 10), [0, 10]);
    });

    it("bag of words reliably creates word vectors", function () {
        const data = ["hello", "hello there", "hello there sir", "HELLO THERE", "HeLlO-ThErE!", "HELLO.THERE"];
        const vector = wordvector(data);
        function bow(text) { return bagofwords(text, vector) }
        const bag = data.map(bow);

        assert.deepEqual(bag, [
            [ 1, 0, 0 ],
            [ 1, 1, 0 ],
            [ 1, 1, 0 ],
            [ 1, 1, 1 ],
            [ 1, 1, 0 ],
            [ 1, 1, 0 ]
        ]);
    });

    it.skip("normalizes data", async function() {
        let extractors = [core.plugins.extractors.TwitterFeatureExtractor];

        let results = await core.extract(extractors);
        assert.equal(results.length, 10);
        assert(results[0].twitter_features);

        const StandardFeatureNormalizer = core.plugins.normalizers.StandardFeatureNormalizer;

        let normalized = await core.normalize(extractors, StandardFeatureNormalizer);
        assert.equal(normalized.length, 10);

        normalized = await core.normalize(extractors, StandardFeatureNormalizer);
        assert.equal(normalized.length, 0);
    });
});

