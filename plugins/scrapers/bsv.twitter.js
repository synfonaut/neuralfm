const log = require("debug")("neuralfm:plugins:scrapers:bsv.twitter");

const config = require("../../config");
const utils = require("../../utils");

const Twitter = require("twitter");

export class BSVTwitterScraper {

  constructor(db, opts={}) {
    if (!db) { throw "expected db" }
    this.db = db;

    this.opts = opts;
    this.limit = opts.limit || 10;
  }

  // scrape recent tweets from usernames
  async run() {
    const client = BSVTwitterScraper.getTwitterClient();
    const usernames = await BSVTwitterScraper.getTwitterUsernames(this.db);

    log(`scraping`);
    for (const username of usernames) {
      const recentTweetID = await BSVTwitterScraper.getLastSeenTweetIDForTwitterAccount(this.db, username);
      try {
        await this.db.collection(BSVTwitterScraper.getUsernameCollectionName()).updateOne({ username }, {"$set": {"updated_date": new Date()}});
        const tweets = await BSVTwitterScraper.fetchRecentTweetsForTwitterAccount(client, username, this.limit, recentTweetID);
        if (tweets && tweets.length > 0) {
          log(`scraped ${tweets.length} tweets from ${username}`);
          const response = await this.db.collection(BSVTwitterScraper.getCollectionName()).insertMany(tweets);
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

  async getDataCursor() {
    return await this.db.collection(BSVTwitterScraper.getCollectionName()).find({});
  }

  // given a tweet, return a uuid
  static fingerprintData(tweet) {
    if (tweet.fingerprint) { return tweet }

    if (!tweet.id) { throw new Error(`tweet has invalid id: ${JSON.stringify(tweet, null, 4)}`) }

    tweet.fingerprint = `twitter-${tweet.id}`;

    return tweet;
  }

  // get last known tweet for username
  static async getLastSeenTweetIDForTwitterAccount(db, username) {
    const recentTweets = await db.collection(BSVTwitterScraper.getCollectionName()).find({"user.screen_name": {"$regex": `${username}`, "$options": "i"}}).sort({"id_str": -1}).limit(1).toArray();
    if (recentTweets && recentTweets.length === 1) {
      return recentTweets[0].id_str;
    }
    return null;
  }

  // fetch tweets from api for username, should use since_id when available
  static fetchRecentTweetsForTwitterAccount(client, username, count=10, since_id=null) {
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
  }

  // return infrequently checked usernames that haven't been checked inside window
  static async getTwitterUsernames(db) {
    return (await db.collection(BSVTwitterScraper.getUsernameCollectionName()).find().sort({"updated_date": 1}).toArray()).map(username => {
      if (!username.updated_date) {
        return username.username;
      } else {
        const now = Date.now();
        const lastCheckInMinutes = (now - username.updated_date) / (60 * 1000); // minutes
        if (lastCheckInMinutes >= BSVTwitterScraper.getTwitterCheckWindowInMinutes()) {
          return username.username;
        } else {
          //log(`skipping twitter user ${username.username}, checked ${utils.round(lastCheckInMinutes)} minutes ago`);
        }
      }
    }).filter(username => { return username });
  }

  // return new twitter API client
  static getTwitterClient(credentials=config.twitter) {
    return new Twitter(credentials);
  }

  static getDatabaseName() {
    return BSVTwitterScraper.name;
  }

  static getCollectionName() {
    return "tweets";
  }

  static getUsernameCollectionName() {
    return "usernames";
  }

  static getTwitterCheckWindowInMinutes() {
    return 30;
  }

  static getAuthor() {
    return "synfonaut"; // name of plugin creator
  }

  static getPaymail() {
   return  "synfonaut@moneybutton.com"; // paymail of plugin creator
  }

  static getVersion() {
    return "0.0.1"; // semvar
  }

  static getDescription() {
    return "Scrapes top BSV Twitter usernames"; // human readable description
  }

  static getDataset() {
    return "BSV Twitter"; // human readable dataset this scraper creates
  }

}


module.exports = BSVTwitterScraper;
