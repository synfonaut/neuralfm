const assert = require("assert");
const core = require("../index");
const utils = require("../../utils");

core.Classifier._getDatabaseName = core.Classifier.getDatabaseName;
core.Classifier.getDatabaseName = function() {
  if (core.Classifier._getDatabaseName().indexOf("Test") !== 0) {
    return `Test${core.Classifier._getDatabaseName()}`;
  }
  return core.Classifier._getDatabaseName();
}


describe("classify", function () {
  this.timeout(5000);
  this.slow(1000);

  beforeEach(async function() {
    await core.Classifier.resetDatabase();
  });

  it("classifies data", async function() {
    const classifier = new core.Classifier("test_classifier");
    await classifier.classify("fingerprint-12345", 1);
    await classifier.classify("fingerprint-54321", -1);
    await classifier.classify("fingerprint-0", 0);

    const classifications = await classifier.getClassifications();
    assert.equal(classifications.length, 3);
  });

  it("handles duplicate classification", async function() {
    const classifier = new core.Classifier("test_classifier");
    await classifier.classify("fingerprint-12345", 1);
    await classifier.classify("fingerprint-12345", 1);

    const classifications = await classifier.getClassifications();
    assert.equal(classifications.length, 1);
  });

  it("removes classification", async function() {
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

  it("silently fails on unclassifying nothing", async function() {
    const classifier = new core.Classifier("test_classifier");
    let classifications;

    await classifier.unclassify("fingerprint-12345");
    await classifier.unclassify("fingerprint-54321");
  });
});

