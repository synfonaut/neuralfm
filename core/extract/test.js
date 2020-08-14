const fs = require("fs");
const assert = require("assert");
const core = require("../index");
const utils = require("../../utils");

import { TestScraper } from "../scrape/test"

// bag of words // td ifs

// simulate API that runs out of data
function getDummyTwitterDataSource(num=0) {
    if (num == 0) { return [ {"fingerprint": "1", "tweet": "hello world"} ] }
    if (num == 1) { return [ {"fingerprint": "2", "tweet": "hi"} ] }
    if (num == 2) { return [ {"fingerprint": "3", "tweet": "hola"} ] }
    return [];
}

async function TestNormalizer(db, opts={}) {
    if (!db) { throw "expected DB" }

    let normalized = [];
    let data, i = 0;
    while ((data = getDummyTwitterDataSource(i++)).length > 0) {
        console.log("DATA", data);
        data.normalized = Object.assign({}, data, {
            tweet_vector: [0],
        });

    }

    return [];
}

TestNormalizer.scrapers = [TestScraper];


describe.skip("extract features", function () {

    before(async function() {

        const fixtures = JSON.parse(fs.readFileSync("./core/extract/fixtures.json", "utf8"));
        assert.equal(TestNormalizer.scrapers.length, 1);
        const db = await core.db(TestNormalizer.scrapers[0].collectionName);
        db.collect
        console.log("DB");


        /*
        let response = await db.collection(TestScraper.collectionName).deleteMany({});
        assert(response);
        assert(response.result);
        assert(response.result.ok);
        */
    });

    it.only("fixtures load data properly", async function() {
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

