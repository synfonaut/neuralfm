const assert = require("assert");
const core = require("../index");
const utils = require("../../utils");

// simulate API that runs out of data
function getDummyTwitterDataSource(num=0) {
    if (num == 0) { return [ {"fingerprint": "1", "tweet": "hello world"} ] }
    if (num == 1) { return [ {"fingerprint": "2", "tweet": "hi"} ] }
    if (num == 2) { return [ {"fingerprint": "3", "tweet": "hola"} ] }
    return [];
}

export async function TestScraper(db, opts={}) {
    if (!db) { throw "expected DB" }

    const recentTweets = await db.collection(TestScraper.collectionName).find({}).sort({"fingerprint": -1}).limit(1).toArray();
    const fingerprint = Number(recentTweets.length == 1 ? recentTweets[0].fingerprint : 0);
    const tweets = getDummyTwitterDataSource(fingerprint);

    if (tweets && tweets.length > 0) {
        const response = await db.collection(TestScraper.collectionName).insertMany(tweets);
        if (!utils.ok(response)) {
            console.log("ERROR", resonse);
            throw "error while inserting tweets"
        }
    }

    return tweets;
}

TestScraper.collectionName = "tweets";

describe("scrape", function () {

    before(async function() {
        const db = await core.db(TestScraper.name);
        let response = await db.collection(TestScraper.collectionName).deleteMany({});
        assert(response);
        assert(response.result);
        assert(response.result.ok);
    });

    it("default plugins load properly", function () {
        assert(core.plugins);
        assert(core.plugins.scrapers.BSVTwitterScraper);
        assert(core.plugins.extractors);
        assert(core.plugins.normalizers);
        assert(core.plugins.networks);
    });

    it("calls scrapers iteratively until synced", async function() {

        let scrapers = [TestScraper];
        let results;

        results = await core.scrape(scrapers);
        assert.equal(results.length, 1);
        assert.equal(results[0].fingerprint, "1");

        results = await core.scrape(scrapers);
        assert.equal(results.length, 1);
        assert.equal(results[0].fingerprint, "2");

        results = await core.scrape(scrapers);
        assert.equal(results.length, 1);
        assert.equal(results[0].fingerprint, "3");

        results = await core.scrape(scrapers);
        assert.equal(results.length, 0);
    });
});

