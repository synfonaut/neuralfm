const assert = require("assert");
const core = require("./index");

describe("core", function () {
    it("default plugins load properly", function () {
        assert(core.plugins);
        assert(core.plugins.scrapers.BSVTwitterScraper);
        assert(core.plugins.extractors);
        assert(core.plugins.normalizers);
        assert(core.plugins.networks);
    });
});

