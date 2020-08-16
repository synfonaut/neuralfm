const fs = require("fs");
const assert = require("assert");
const core = require("../../core");
const scrape = require("../../core/scrape");
const utils = require("../../utils");

import { minmax, wordvector, bagofwords, normalizeValues } from "./standard"

describe("normalize features", function () {

    beforeEach(async function() {
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

            response = await db.collection(scraper.getUsernameCollectionName()).deleteMany({});
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

            // reset metadata
            response = await db.collection(core.plugins.normalizers.StandardFeatureNormalizer.getCollectionName()).deleteMany({});
            assert(response);
            assert(response.result);
            assert(response.result.ok);
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

    it("normalizeValue reliably calculates correct value", function () {
        assert.deepEqual(normalizeValues([1, 5, 10], 0, 10), [0.1, 0.5, 1]);
        assert.deepEqual(normalizeValues([100, 25, 20], 0, 10), [1, 1, 1]);
        assert.deepEqual(normalizeValues([100, -25, 20], 0, 10), [1, 0, 1]);
        assert.deepEqual(normalizeValues([1, 1, 1], 1, 1), [1, 1, 1]);
        assert.deepEqual(normalizeValues([-10, 1, 10], 1, 1), [1, 1, 1]);

        const lower = new Date();
        const middle = new Date();
        const upper = new Date();
        middle.setDate(middle.getDate() + 7);
        upper.setDate(upper.getDate() + 14);
        assert.deepEqual(normalizeValues([middle], lower, upper), [0.5]);
    });

    it("bag of words reliably creates word vectors", function () {
        const data = ["hello", "hello there", "hello there sir", "HELLO THERE", "HeLlO-ThErE!", "HELLO.THERE"];
        const vector = wordvector(data);

        function bow(text) { return bagofwords(text, vector) }
        const bag = data.map(bow);
        assert.deepEqual(bag, [
            [ 1, 0, 0 ],
            [ 1, 1, 0 ],
            [ 1, 1, 1 ],
            [ 1, 1, 0 ],
            [ 1, 1, 0 ],
            [ 1, 1, 0 ]
        ]);

        assert.deepEqual(bagofwords("not in bag", vector), [0, 0, 0]);
    });

    it("bag of words normalizes urls", function () {
        const data = ["What if the world we were living in was just a lobby, and the real world has just started?\n\nhttps://t.co/2sPHLQ0xFJ"];
        const vector = wordvector(data);
        function bow(text) { return bagofwords(text, vector) }
        const bag = data.map(bow);
        assert.deepEqual(bagofwords("what", vector), [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        assert.deepEqual(bagofwords("what if", vector), [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        assert.deepEqual(bagofwords("started", vector), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]);
        assert.deepEqual(bagofwords("https://t.co/2sPHLQ0xFJ", vector), [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]);
    });

    it("bag of words reliably strips out non-alphanumeric characters", function () {
        const data = ["wh0t", "are?", "!you!", "doing???", "to", "fix", "broken", "words!!words", "are?you!", "you're"];
        const vector = wordvector(data);
        function bow(text) { return bagofwords(text, vector) }
        const bag = data.map(bow);
        assert.deepEqual(bag, [
            [ 0, 0, 0, 0, 0, 0, 1, 0, 0],
            [ 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 1, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 1, 0, 0, 0],
            [ 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [ 0, 0, 1, 0, 0, 0, 0, 0, 0],
            [ 0, 0, 0, 0, 0, 0, 0, 1, 0],
            [ 1, 1, 0, 0, 0, 0, 0, 0, 0],
            [ 0, 1, 0, 0, 0, 0, 0, 0, 1],
        ]);
    });

    it("bag of words creates category vectors", function () { // category vecors treat text columns as categories
        const data = ["user", "user_name", "user_same"];
        const vector = wordvector(data);

        function bow(text) { return bagofwords(text, vector) }
        const bag = data.map(bow);
        assert.deepEqual(bag, [
            [ 1, 0, 0 ],
            [ 0, 1, 0 ],
            [ 0, 0, 1 ],
        ]);

        assert.deepEqual(bagofwords("not in bag", vector), [0, 0, 0]);
    });

    it("bag of words normalizes usernames", function () {
        const data = ["hello @username_with_underscores", "how are you doing?", "im doing well @synfonaut", "thats good to hear @brad", "ok cool", "@username_with_underscores"];
        const vector = wordvector(data);
        function bow(text) { return bagofwords(text, vector) }
        const bag = data.map(bow);
        assert.deepEqual(bag, [[1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0],[0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]);
    });

    it("normalizes data", async function() {
        this.timeout(10000);
        this.slow(1000);

        let extractors = [core.plugins.extractors.TwitterFeatureExtractor];

        let results = await core.extract(extractors);
        assert.equal(results.length, 10);
        assert(results[0].twitter_features);

        const StandardFeatureNormalizer = core.plugins.normalizers.StandardFeatureNormalizer;

        let normalized = await core.normalize(extractors, StandardFeatureNormalizer);
        assert.equal(normalized.length, 10);
        assert(normalized[0].fingerprint);
        assert(normalized[0].date != null);
        assert(normalized[0].likes != null);
        assert(normalized[0].retweets != null);
        assert(normalized[0].author.length == 2);
        assert(normalized[0].submitter.length == 2);
        assert(normalized[0].text.length > 0);

        normalized = await core.normalize(extractors, StandardFeatureNormalizer);
        assert.equal(normalized.length, 0);
    });

});

