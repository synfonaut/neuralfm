const assert = require("assert");
const app = require("./index");

describe("app", function () {
    it("default plugins load properly", function () {
        assert(app.plugins);
        assert(app.plugins.scrapers.BSVTwitterScraper);
        assert(app.plugins.extractors);
        assert(app.plugins.normalizers);
        assert(app.plugins.networks);
    });
});

