const assert = require("assert");
const core = require("../../core");
const plugins = require("../index");

assert(plugins);
assert(plugins.scrapers.BSVTwitterScraper);

const BSVTwitterScraper = plugins.scrapers.BSVTwitterScraper;
BSVTwitterScraper.dbname = `Test${BSVTwitterScraper.name}`;

describe("bsv twitter scraper", function () {

  before(async function() {
    const db = await core.db(BSVTwitterScraper.dbname);
    await db.collection(BSVTwitterScraper.collectionName).deleteMany({});
    await db.collection(BSVTwitterScraper.userCollectionName).deleteMany({});
    await db.collection(BSVTwitterScraper.userCollectionName).insertMany([
      {"username": "synfonaut"},
      {"username": "_unwriter"},
    ]);
  });

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

  it("syncs recent tweets from top users", async function () {
    this.timeout(10000);
    this.slow(5000);

    const opts = {
      limit: 5,
    };

    let db, usernames;

    db = await core.db(BSVTwitterScraper.dbname);
    usernames = await BSVTwitterScraper.getTwitterUsernames(db);
    assert.equal(usernames.length, 2);

    let scrapers = [BSVTwitterScraper];
    let results;

    // synfonaut
    results = await core.scrape(scrapers, opts);
    assert.equal(results.length, 5);
    assert(results[0].fingerprint);

    // unwriter
    results = await core.scrape(scrapers, opts);
    assert.equal(results.length, 5);
    assert(results[0].fingerprint);

    // empty
    results = await core.scrape(scrapers, opts);
    assert.equal(results.length, 0);

    // no more twitter users to check
    db = await core.db(BSVTwitterScraper.dbname);
    usernames = await BSVTwitterScraper.getTwitterUsernames(db);
    assert.equal(usernames.length, 0);
  });
});

