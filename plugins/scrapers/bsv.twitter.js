const log = require("debug")("neuralfm:plugins:scrapers:bsv.twitter");

const config = require("../../config");

const Twitter = require("twitter");

function BSVTwitterScraper(opts={}) {
  const limit = opts.limit || 10;
  const usernames = opts.usernames || BSVTwitterScraper.getTwitterUsernames();

  const client = BSVTwitterScraper.getTwitterClient();

  function getTweets(username) {
    return BSVTwitterScraper.getRecentTweetsForTwitterAccount(client, username, limit);
  }

  log(`scraping tweets for ${usernames.length} users`);
  return new Promise(function(resolve, reject) {
    Promise.all(usernames.map(getTweets)).then(function(results) {
      const tweets = [];
      for (const userTweets of results) {
        for (const tweet of userTweets) {
          tweets.push(tweet);
        }
      }

      resolve(tweets);
    }).catch(function(e) {
      log(`error scraping tweets: ${e}`);
      reject(e);
    });
  });
}

BSVTwitterScraper.fingerprintData = function(tweet) {
  if (tweet.fingerprint) { return tweet }

  if (!tweet.id) { throw new Error(`tweet has invalid id: ${JSON.stringify(tweet, null, 4)}`) }

  tweet.fingerprint = `twitter-${tweet.id}`;

  return tweet;
}

BSVTwitterScraper.getTwitterClient = function() {
  return new Twitter(config.twitter);
}

BSVTwitterScraper.getTwitterUsernames = function() {
  return [
    "synfonaut",
    "_unwriter",
    "cryptoacorns",
    "JimmyWinSV",
    "AttilaAros",
    "libitx",
    "DanielKrawisz",
    "coinyeezy",
    "mwilcox",
    "deggen",
    "shadders333",
    "mrz1818",
    "linzheming",
    "disco_donald",
    "liujackc",
    "deanmlittle",
    "kurtwuckertjr",
    "bitcoin_beyond",
    "1rootSV",
    "JamesBelding",
    "sinoTrinity",
    "jeffmaxthon",
    "JacksonLaskey",
    "murphsicles",
    "iamzatoshi",
    "street5wall",
    "digitsu",
    "shruggr",
    "scottjbarr",
    "c0inalchemist",
    "nondualrandy",
    "stoichammer",
    "akondelin",
    "themullenmuhr",
    "jackd004",
    "chblm",
    "kenshishido",
    "realcoingeek",
    "calvinayre",
    "bitcoinsofia",
    "jonathanaird",
    "elasdigital",
    "connolly_dan",
    "bsvdevs",
    "jcbstwsk",
    "satoshidoodles",
    "pmitchev",
    "justicemate",
    "_kevin_pham",
    "wildsatchmo",
    "theoryofbitcoin",
  ];
};

BSVTwitterScraper.getRecentTweetsForTwitterAccount = function(client, username, count=10) {
  return new Promise(function(resolve, reject) {
    if (!client) { return reject("invalid client") }
    if (!username) { return reject("invalid username") }

    log(`scraping recent tweets for ${username}`);
    const params = { screen_name: username, trim_user: 1, count };
    client.get("statuses/user_timeline", params, function(error, tweets, response) {
      if (error) { return reject(error) }
      resolve(tweets.map(BSVTwitterScraper.fingerprintData));
    });
  });
};

/** Author: Enter the name of the creator of this plugin **/
BSVTwitterScraper.author = "synfonaut";

/** Paymail: Enter the paymail of the creator of this plugin **/
BSVTwitterScraper.paymail = "synfonaut@moneybutton.com";

/** Version: Enter a semver version for this plugin **/
BSVTwitterScraper.version = "0.0.1";

/** Description: What does this plugin do? **/
BSVTwitterScraper.description = "Scrapes top BSV Twitter usernames";

/** Name: What's the name of the dataset that is created from this plugin? **/
BSVTwitterScraper.dataset = "BSV Twitter";

module.exports = BSVTwitterScraper;
