const fs = require("fs");
const assert = require("assert");
const core = require("../index");
const utils = require("../../utils");
const helpers = require("../../helpers");

describe("channels", function () {
  this.timeout(5000);
  this.slow(1000);

  beforeEach(async function() {
      await helpers.setupTestDatabase();
  });

  it("creates a channel with no neural network", async function() {
    const channel = await core.channels.create("BSV News");
    assert(channel);
    assert.equal(channel.name, "BSV News");

    const fetchedChannel = await core.channels.getByName("BSV News");
    assert(fetchedChannel);
    assert.equal(fetchedChannel.name, "BSV News");
  });

  it("doesn't create duplicate channels", async function() {
    const channel = await core.channels.create("BSV News");
    assert(channel);
    assert.equal(channel.name, "BSV News");

    let allowedDupe = true;
    try {
      const duplicateChannel = await core.channels.create("BSV News");
    } catch (e) {
      allowedDupe = false;
    }

    assert(!allowedDupe);
  });

  it("creates channel with neural network", async function() {
    // create network
    const scraper = core.plugins.scrapers.BSVTwitterScraper;
    const extractor = core.plugins.extractors.TwitterFeatureExtractor;
    const normalizer = core.plugins.normalizers.StandardFeatureNormalizer;
    const network = core.plugins.networks.BrainNeuralNetwork;
    const classifier = "test neural network name";

    const fingerprint = await core.networks.create(scraper, extractor, normalizer, network, classifier);
    assert.equal(fingerprint, "BSVTwitterScraper:TwitterFeatureExtractor:StandardFeatureNormalizer:test neural network name:0");

    const networkInstance = await core.networks.load(fingerprint);
    assert(networkInstance);
    assert.equal(scraper.name, networkInstance.scraper.constructor.name);
    assert.equal(extractor.name, networkInstance.extractor.constructor.name);
    assert.equal(normalizer.name, networkInstance.normalizer.constructor.name);
    assert.equal(network.name, networkInstance.constructor.name);
    assert.equal(classifier, networkInstance.classifier.name);

    await networkInstance.scraper.run();
    await networkInstance.extractor.run();
    await networkInstance.normalizer.run();

    await networkInstance.classifier.classify("twitter-1294363849961820200", 1);

    await core.networks.train(networkInstance);

    const results = await networkInstance.normalizer.getDataSource();
    let found = false;
    for (const result of results) {
      const prediction = result.predictions[networkInstance.fingerprint];
      assert(prediction > 0.8);
      found = true;
    }
    assert(found);

    // create channel

    const channel = await core.channels.create("BSV News", networkInstance);
    assert(channel);
    assert.equal(channel.name, "BSV News");
    assert(channel.network);

    const fetchedChannel = await core.channels.getByName("BSV News");
    assert(fetchedChannel);
    assert.equal(fetchedChannel.name, "BSV News");
    assert(fetchedChannel.network);
    assert.equal(fetchedChannel.network.fingerprint, networkInstance.fingerprint);

    // zero out previous predictions
    const newResults = await networkInstance.normalizer.getDataSource();
    found = false;
    for (const result of newResults) {
      delete result.predictions[networkInstance.fingerprint];
      found = true;
    }
    assert(found);

    found = false;
    for (const result of newResults) {
      const normalizedData = result[fetchedChannel.network.normalizer.constructor.getNormalizedFieldName(fetchedChannel.network.extractor)];
      const normalizedInput = fetchedChannel.network.normalizer.constructor.convertToTrainingDataInput(normalizedData);
      const prediction = networkInstance.predict(normalizedInput);
      assert(prediction > 0.8);
      found = true;
    }
    assert(found);
  });
});

