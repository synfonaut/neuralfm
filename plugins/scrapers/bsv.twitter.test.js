const assert = require("assert");
const plugins = require("../index");

describe("bsv twitter scraper", function () {
  it("verify plugin meta data", function () {
    assert(plugins);
    assert(plugins.scrapers.BSVTwitterScraper);

    const BSVTwitterScraper = plugins.scrapers.BSVTwitterScraper;
    assert.equal(BSVTwitterScraper.dataset, "BSV Twitter");
    assert.equal(BSVTwitterScraper.author, "synfonaut");
    assert.equal(BSVTwitterScraper.paymail, "synfonaut@moneybutton.com");
    assert(BSVTwitterScraper.description);
    assert(BSVTwitterScraper.version);
  });

  it.skip("gets recent tweets from user", function () {
    const results = BSVTwitterScraper();
    console.log("RESULTS");
    assert(results);
  });
});

