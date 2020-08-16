const assert = require("assert");
const core = require("../index");
const utils = require("../../utils");

core.Classifier._getDatabaseName = core.Classifier.getDatabaseName;
core.Classifier.getDatabaseName = function() {
  return `Test${core.Classifier._getDatabaseName()}`;
}

describe("classify", function () {

    beforeEach(async function() {
        const db = await core.db(core.Classifier.getDatabaseName());
        await core.Classifier.createIndexes(db);
        await db.collection(core.Classifier.getCollectionName()).deleteMany({});
    });

    it("classifies data", async function() {
        this.timeout(10000);
        this.slow(2500);

        const classifier = new core.Classifier("test_classifier");
        await classifier.classify("fingerprint-12345", 1);
        await classifier.classify("fingerprint-54321", -1);
        await classifier.classify("fingerprint-0", 0);

        const classifications = await classifier.getClassifications();
        assert.equal(classifications.length, 3);
    });

    it("handles duplicate classification", async function() {
        this.timeout(10000);
        this.slow(2500);

        const classifier = new core.Classifier("test_classifier");
        await classifier.classify("fingerprint-12345", 1);
        await classifier.classify("fingerprint-12345", 1);

        const classifications = await classifier.getClassifications();
        assert.equal(classifications.length, 1);
    });

    it("removes classification", async function() {
        this.timeout(10000);
        this.slow(2500);

        const classifier = new core.Classifier("test_classifier");
        let classifications;

        await classifier.classify("fingerprint-12345", 1);
        classifications = await classifier.getClassifications();
        assert.equal(classifications.length, 1);

        await classifier.unclassify("fingerprint-12345");
        classifications = await classifier.getClassifications();
        assert.equal(classifications.length, 0);

        await classifier.classify("fingerprint-12345", 1);
        classifications = await classifier.getClassifications();
        assert.equal(classifications.length, 1);

    });

    // silently fails on unclassifying nothing

});

