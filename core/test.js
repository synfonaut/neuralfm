const assert = require("assert");
const core = require("./index");

describe("core plugins", function () {
    it("default plugins load properly", function () {
        assert(core.plugins);
        assert(core.plugins.scrapers.BSVTwitterScraper);
        assert(core.plugins.extractors.TwitterFeatureExtractor);
        assert(core.plugins.normalizers.StandardFeatureNormalizer);
        assert(core.plugins.networks.BrainNeuralNetwork);
        assert(core.Classifier);
    });

    it("default plugins load properly", function () {
        assert(core.plugins.scrapers.BSVTwitterScraper.getDatabaseName().indexOf("Test") === 0);
        assert(core.plugins.networks.BrainNeuralNetwork.getDatabaseName().indexOf("Test") === 0);
        assert(core.Classifier.getDatabaseName().indexOf("Test") === 0);
    });
});

