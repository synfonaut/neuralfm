const log = require("debug")("neuralfm:plugins:scrapers:bsv.twitter");

const config = require("../../config");
const utils = require("../../utils");

const Twitter = require("twitter");

async function BSVTwitterScraper(db, opts={}) {
  if (!db) { throw "expected DB" }
  const limit = opts.limit || 10;
  const usernames = opts.usernames || await BSVTwitterScraper.getTwitterUsernames(db);

  const client = BSVTwitterScraper.getTwitterClient();

  log(`scraping`);
  for (const username of usernames) {
    const recentTweetID = await BSVTwitterScraper.getMostRecentTweetIDForTwitterAccount(db, username);
    try {
      await db.collection("usernames").updateOne({ username }, {"$set": {"updated_date": new Date()}});
      const tweets = await BSVTwitterScraper.getRecentTweetsForTwitterAccount(client, username, limit, recentTweetID);
      if (tweets && tweets.length > 0) {
        log(`scraped ${tweets.length} tweets from ${username}`);
        const response = await db.collection(BSVTwitterScraper.collectionName).insertMany(tweets);
        if (utils.ok(response)) {
          log(`inserted ${tweets.length} tweets for ${username}`);
          return tweets;
        } else {
          log(`error scraping BSV twitter user ${username}, unable to insert scraped tweets`);
        }
      }
    } catch (e) {
      log(`error scraping BSV twitter user ${username}, resonse error: ${e}`);
    }

    await utils.sleep(1000);
  }

  return [];
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

BSVTwitterScraper.getTwitterUsernames = async function(db) {
  return (await db.collection("usernames").find().sort({"updated_date": 1}).toArray()).map(username => {
    return username.username;
  });
}


BSVTwitterScraper.getMostRecentTweetIDForTwitterAccount = async function(db, username) {
  //const recentTweets = await db.collection(BSVTwitterScraper.collectionName).find({"user.screen_name": username}).sort({"id_str": -1}).limit(1).toArray();
  const recentTweets = await db.collection(BSVTwitterScraper.collectionName).find({"user.screen_name": {"$regex": `${username}`, "$options": "i"}}).sort({"id_str": -1}).limit(1).toArray();
  if (recentTweets && recentTweets.length === 1) {
    return recentTweets[0].id_str;
  }
  return null;
}

BSVTwitterScraper.getRecentTweetsForTwitterAccount = function(client, username, count=10, since_id=null) {
  return new Promise(function(resolve, reject) {
    if (!client) { return reject("invalid client") }
    if (!username) { return reject("invalid username") }

    log(`scraping ${username} recent tweets count=${count} since_id=${since_id}`);
    const params = { screen_name: username, count };
    if (since_id) {
      params.since_id = since_id;
    }
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

/** Collection Name: Name of the primary MongoDB table to store data**/
BSVTwitterScraper.collectionName = "tweets";

module.exports = BSVTwitterScraper;
