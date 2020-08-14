const assert = require("assert");
const plugins = require("../index");

assert(plugins);
assert(plugins.scrapers.BSVTwitterScraper);

const BSVTwitterScraper = plugins.scrapers.BSVTwitterScraper;

describe("bsv twitter scraper", function () {
  it("verify plugin meta data", function () {
    assert.equal(BSVTwitterScraper.dataset, "BSV Twitter");
    assert.equal(BSVTwitterScraper.author, "synfonaut");
    assert.equal(BSVTwitterScraper.paymail, "synfonaut@moneybutton.com");
    assert(BSVTwitterScraper.description);
    assert(BSVTwitterScraper.version);
  });

  it("gets recent tweets from user", function (done) {
    this.timeout(10000);
    this.slow(5000);
    const client = BSVTwitterScraper.getTwitterClient();
    BSVTwitterScraper.getRecentTweetsForTwitterAccount(client, "synfonaut").then(function (results) {
      assert(results);
      assert.equal(results.length, 10);
      assert(results[0].created_at);
      assert(results[0].id);
      assert(results[0].text);
      assert(results[0].user);
      assert(results[0].user.id);
      assert(results[0].fingerprint);
      done();
    });
  });

  it("gets recent tweets from top users", function (done) {
    this.timeout(10000);
    this.slow(5000);

    const opts = {
      usernames: ["synfonaut", "_unwriter"],
      limit: 5,
    };

    BSVTwitterScraper(opts).then(function(results) {
      assert(results);
      assert.equal(results.length, 10);
      assert(results[0].created_at);
      assert(results[0].id);
      assert(results[0].text);
      assert(results[0].user);
      assert(results[0].user.id);
      assert(results[0].fingerprint);
      done();
    });
  });

  // TODO: Scrape tweets
  // TODO: includes getting DB object and updating it with state, then checking again and verifying already synced up
});

