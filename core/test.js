const assert = require("assert");
const core = require("./index");
const config = require("../config");

config._databaseName = config.databaseName;
config.databaseName = `Test${config._databaseName}`;

describe("core plugins", function () {
    it("default plugins load properly", function () {
        assert(core.plugins);
        assert(core.plugins.scrapers.BSVTwitterScraper);
        assert(core.plugins.extractors.TwitterFeatureExtractor);
        assert(core.plugins.normalizers.StandardFeatureNormalizer);
        assert(core.plugins.networks.BrainNeuralNetwork);
        assert(core.Classifier);
    });

    it("database gets test names", function () {
        assert(core.plugins.scrapers.BSVTwitterScraper.getDatabaseName().indexOf("Test") === 0);
        assert(core.plugins.networks.BrainNeuralNetwork.getDatabaseName().indexOf("Test") === 0);
        assert(core.Classifier.getDatabaseName().indexOf("Test") === 0);
        assert(config.databaseName.indexOf("Test") === 0);
    });
});

