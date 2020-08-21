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

    const fetchedChannel = await core.channels.getBySlug(channel.slug);
    assert(fetchedChannel);
    assert.equal(fetchedChannel.name, "BSV News");
  });

  it("doesn't create duplicate channels", async function() {
    const channel = await core.channels.create("BSV News");
    assert(channel);
    assert.equal(channel.name, "BSV News");
    assert.equal(channel.slug, "bsv-news");

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

    const oldNetworkInstance = await core.networks.create(scraper, extractor, normalizer, network, classifier);
    assert(oldNetworkInstance);

    const networkInstance = await core.networks.load(oldNetworkInstance.fingerprint);

    assert(networkInstance);
    assert.equal(scraper.name, networkInstance.scraper.constructor.name);
    assert.equal(extractor.name, networkInstance.extractor.constructor.name);
    assert.equal(normalizer.name, networkInstance.normalizer.constructor.name);
    assert.equal(network.name, networkInstance.constructor.name);
    assert.equal(classifier, networkInstance.classifier.name);

    await networkInstance.scraper.run();
    await networkInstance.extractor.run();
    await networkInstance.normalizer.run();

    await networkInstance.classifier.classify("twitter-1293919071222849500", 1);

    await core.networks.train(networkInstance);
    await core.networks.updateFingerprint(networkInstance.constructor, oldNetworkInstance.fingerprint, networkInstance.fingerprint);

    const results = await networkInstance.getDataSource();
    let found = false;
    for (const result of results) {
      const prediction = result.predictions[networkInstance.fingerprint];
      assert(prediction > 0);
      found = true;
    }
    assert(found);

    // create channel

    const channel = await core.channels.create("BSV News", networkInstance);
    assert(channel);
    assert.equal(channel.name, "BSV News");
    assert(channel.network_fingerprint);

    const fetchedChannel = await core.channels.getBySlug(channel.slug);

    assert(fetchedChannel);
    assert.equal(fetchedChannel.name, "BSV News");
    assert(fetchedChannel.network_fingerprint);
    assert.equal(fetchedChannel.network_fingerprint, networkInstance.fingerprint);
    assert(fetchedChannel.network);

    // zero out previous predictions
    const newResults = await networkInstance.getDataSource();
    found = false;
    for (const result of newResults) {
      delete result.predictions[networkInstance.network_fingerprint];
      found = true;
    }
    assert(found);

    found = false;
    for (const result of newResults) {
      const normalizedData = result[fetchedChannel.network.normalizer.constructor.getNormalizedFieldName(fetchedChannel.network.extractor)];
      const normalizedInput = fetchedChannel.network.normalizer.constructor.convertToTrainingDataInput(normalizedData);
      const prediction = networkInstance.predict(normalizedInput);
      assert(prediction > 0);
      found = true;
    }
    assert(found);
  });

  // TODO: very long test..some parts likely not needed.... it was 3:30am :(
  it("updates channel with neural network", async function() {
    // create network
    const scraper = core.plugins.scrapers.BSVTwitterScraper;
    const extractor = core.plugins.extractors.TwitterFeatureExtractor;
    const normalizer = core.plugins.normalizers.StandardFeatureNormalizer;
    const network = core.plugins.networks.BrainNeuralNetwork;
    const classifier = "test neural network name";

    const oldNetworkInstance = await core.networks.create(scraper, extractor, normalizer, network, classifier);
    assert(oldNetworkInstance);
    const oldFingerprint = oldNetworkInstance.fingerprint;

    const networkInstance = await core.networks.load(oldNetworkInstance.fingerprint);
    assert(networkInstance);
    assert.equal(scraper.name, networkInstance.scraper.constructor.name);
    assert.equal(extractor.name, networkInstance.extractor.constructor.name);
    assert.equal(normalizer.name, networkInstance.normalizer.constructor.name);
    assert.equal(network.name, networkInstance.constructor.name);
    assert.equal(classifier, networkInstance.classifier.name);

    await networkInstance.scraper.run();
    await networkInstance.extractor.run();
    await networkInstance.normalizer.run();

    await networkInstance.classifier.classify("twitter-1293919071222849500", 1);

    await core.networks.train(networkInstance);
    await core.networks.updateFingerprint(networkInstance.constructor, oldFingerprint, networkInstance.fingerprint);

    const results = await networkInstance.getDataSource();
    let found = false;
    for (const result of results) {
      const prediction = result.predictions[networkInstance.fingerprint];
      assert(prediction > 0);
      found = true;
    }
    assert(found);

    // create channel

    const channel = await core.channels.create("BSV News", networkInstance);
    assert(channel);
    assert.equal(channel.name, "BSV News");
    assert(channel.network_fingerprint);

    const fetchedChannel = await core.channels.getBySlug(channel.slug);
    assert(fetchedChannel);
    assert.equal(fetchedChannel.name, "BSV News");
    assert(fetchedChannel.network_fingerprint);
    assert.equal(fetchedChannel.network_fingerprint, networkInstance.fingerprint);
    assert(fetchedChannel.network);

    // zero out previous predictions
    const newResults = await networkInstance.getDataSource();
    found = false;
    for (const result of newResults) {
      delete result.predictions[networkInstance.network_fingerprint];
      found = true;
    }
    assert(found);

    found = false;
    for (const result of newResults) {
      const normalizedData = result[fetchedChannel.network.normalizer.constructor.getNormalizedFieldName(fetchedChannel.network.extractor)];
      const normalizedInput = fetchedChannel.network.normalizer.constructor.convertToTrainingDataInput(normalizedData);
      const prediction = networkInstance.predict(normalizedInput);
      assert(prediction > 0);
      found = true;
    }
    assert(found);

    // this test is awful
    const notAsOldNetworkFingerprint = networkInstance.fingerprint;
    await networkInstance.classifier.classify("twitter-1294011732902285300", 1);
    await core.networks.train(networkInstance);

    const fingerprint = networkInstance.fingerprint;
    assert(oldFingerprint != fingerprint);
    assert(notAsOldNetworkFingerprint != fingerprint);

    // TODO: fix this stupid hacky ass method signature...passing in a constructor? wtf...
    await core.networks.updateFingerprint(networkInstance.constructor, notAsOldNetworkFingerprint, fingerprint);

    const newNetworkInstance = await core.networks.load(fingerprint);
    assert(newNetworkInstance);
    assert.equal(newNetworkInstance.fingerprint, fingerprint);

    await core.channels.updateNetwork(channel.slug, fingerprint);
    const newFetchedChannel = await core.channels.getBySlug(channel.slug);
    assert.equal(newFetchedChannel.network_fingerprint, fingerprint);
  });

});

