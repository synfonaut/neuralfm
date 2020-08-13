const config = require("../../config");

const Twitter = require("twitter");

function BSVTwitterScraper(opts={}) {
  const limit = opts.limit || 10;
  const username = opts.username;

  return new Promise(function(resolve, reject) {
    if (!username) {
      return reject("invalid username");
    }

    const client = BSVTwitterScraper.getTwitterClient();

    return [];
  });
}

BSVTwitterScraper.getTwitterClient = function() {
  return new Twitter(config.twitter);
}

BSVTwitterScraper.getTwitterAccounts = function() {
  return ["synfonaut"];
};

BSVTwitterScraper.getRecentTweetsForTwitterAccount = function(client, username) {
  return new Promise(function(resolve, reject) {
    if (!client) { return reject("invalid client") }
    if (!username) { return reject("invalid username") }

    const params = { screen_name: username, trim_user: 1, count: 200 };
    client.get("statuses/user_timeline", params, function(error, tweets, response) {
      if (error) { return reject(error) }
      resolve(tweets);
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
BSVTwitterScraper.description = "Scrapes top BSV Twitter accounts";

/** Name: What's the name of the dataset that is created from this plugin? **/
BSVTwitterScraper.dataset = "BSV Twitter";

module.exports = BSVTwitterScraper;
