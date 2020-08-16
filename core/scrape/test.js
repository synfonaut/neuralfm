const assert = require("assert");
const core = require("../index");
const utils = require("../../utils");
const database = require("../../core/db").db;

export class TestScraper {
    constructor(db, opts={}) {
        if (!db) { throw "expected DB" }
        this.db = db;

        this.opts = opts;

        this.dbname = opts.dbname || this.name;
    }

    async run() {
        const tweets = TestScraper.getData(await this.getLastSeenFingerprint());

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

    static getData(since=0) {
        if (since == 0) { return [ {"fingerprint": "1", "tweet": "hello world"} ] }
        if (since == 1) { return [ {"fingerprint": "2", "tweet": "hi"} ] }
        if (since == 2) { return [ {"fingerprint": "3", "tweet": "hola"} ] }
        return [];
    }

    static getCollectionName() {
        return "test_tweets";
    }

    static getDatabaseName() {
        return TestScraper.name;
    }

    static async createIndexes(db) {
        await db.collection(this.getCollectionName()).createIndex({ "fingerprint": 1 }, {"unique": true});
    }

    static async resetDatabase() {
        const db = await database(this.getDatabaseName());
        await db.collection(this.getCollectionName()).deleteMany();
        await this.createIndexes(db);
        db.close();
    }
}

describe("scrape", function () {

    beforeEach(async function() {
        await TestScraper.resetDatabase();
    });

    it("default plugins load properly", function () {
        assert(core.plugins);
        assert(core.plugins.scrapers.BSVTwitterScraper);
        assert(core.plugins.extractors);
        assert(core.plugins.normalizers);
        assert(core.plugins.networks);
    });

    it("calls scrapers iteratively until synced", async function() {
        this.timeout(10000);
        this.slow(2500);

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

    it("verifies fingerprints are unique", async function() {
        const db = await core.db(TestScraper.getDatabaseName());
        let response;

        response = await db.collection(TestScraper.getCollectionName()).insert(TestScraper.getData(0));
        assert(utils.ok(response));

        // should fail
        try {
            response = await db.collection(TestScraper.getCollectionName()).insert(TestScraper.getData(0));
        } catch(e) {
            assert.equal(e.name, "BulkWriteError");
            assert(true);
        }

        db.close();
    });

});

