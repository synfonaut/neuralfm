const fs = require("fs");
const assert = require("assert");
const core = require("../../core");
const scrapersCore = require("../../core/scrapers");
const utils = require("../../utils");
const helpers = require("../../helpers");

describe("extract features", function () {
    beforeEach(async function() {
        await helpers.setupTestDatabase();
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

    it("extract features from tweet", async function() {
        this.timeout(5000);
        this.slow(1000);

        let extractors = [core.plugins.extractors.TwitterFeatureExtractor];
        let results;

        results = await core.extractors.extract(extractors);
        assert.equal(results.length, 20);
        assert(results[0].twitter_features);

        results = await core.extractors.extract(extractors);
        assert.equal(results.length, 0);
    });

    it("extracts retweet data from tweet", async function() {
        this.timeout(5000);
        this.slow(1000);

        let extractors = [core.plugins.extractors.TwitterFeatureExtractor];
        let results = await core.extractors.extract(extractors);
        let found = false;
        for (const result of results) {
            if (result.fingerprint === "twitter-1294715425293394000") {
                found = true;
                assert.equal(result[extractors[0].getFeaturesFieldName()].text, "hello! for the past decade I've been building bespoke, a free modular synth environment with python livecoding support for mac/windows/linux\n\nyou can find the code and get builds at https://t.co/GnJwVKN8uB\n\nand if you scroll through my feed, you'll find a bunch of videos of it https://t.co/uxezjmKXk1");
            }
        }
        assert(found);
    });

    it("extracts quote retweet data from tweet", async function() {
        this.timeout(5000);
        this.slow(1000);

        let extractors = [core.plugins.extractors.TwitterFeatureExtractor];
        let results = await core.extractors.extract(extractors);
        let found = false;
        for (const result of results) {
            if (result.fingerprint === "twitter-1294038780836327400") {
                found = true;
                assert.equal(result[extractors[0].getFeaturesFieldName()].text, "the opening paragraph of the Fortnite lawsuit 😂 https://t.co/0Y7Wvy2O8I https://t.co/QmkrXCy0Si BOWTWITTERQUOTE Epic Games has filed legal papers in response to Apple, read more here: https://t.co/c4sgvxQUvb");
            }
        }
        assert(found);
    });
});

