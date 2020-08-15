const assert = require("assert");
const core = require("../index");
const utils = require("../../utils");

export class TestScraper {
    constructor(db, opts={}) {
        if (!db) { throw "expected DB" }
        this.db = db;

        this.opts = opts;

        this.dbname = opts.dbname || this.name;
    }

    async run() {
        const tweets = this.getData(await this.getLastSeenFingerprint());

        if (tweets && tweets.length > 0) {
            const response = await this.db.collection(TestScraper.getCollectionName()).insertMany(tweets);
            if (!utils.ok(response)) {
                console.log("ERROR", resonse);
                throw "error while inserting tweets"
            }
        }

        return tweets;
    }

    async getLastSeenFingerprint() {
        const recentTweets = await this.db.collection(TestScraper.getCollectionName()).find({}).sort({"fingerprint": -1}).limit(1).toArray();
        return Number(recentTweets.length == 1 ? recentTweets[0].fingerprint : 0);
    }

    getData(since=0) {
        if (since == 0) { return [ {"fingerprint": "1", "tweet": "hello world"} ] }
        if (since == 1) { return [ {"fingerprint": "2", "tweet": "hi"} ] }
        if (since == 2) { return [ {"fingerprint": "3", "tweet": "hola"} ] }
        return [];
    }

    static getCollectionName() {
        return "tweets";
    }

    static getDatabaseName() {
        return TestScraper.name;
    }
}

describe("scrape", function () {

    before(async function() {
        const db = await core.db(TestScraper.getDatabaseName());

        let response = await db.collection(TestScraper.getCollectionName()).deleteMany({});
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

