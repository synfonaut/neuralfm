const path = require("path");

const plugins = require("../plugins");

module.exports = {
    plugins,
};

console.log(plugins.scrapers);
console.log(plugins.extractors);
console.log(plugins.normalizers);
console.log(plugins.networks);

// scrape data -> fingerprint
// extract features -> features
// normalize -> input
// (core) classify -> fingerprint,output
// train on network
//

// be thinking about plugins
// be thinking about snapshotting data to the blockchain


// create tests for plugin system, very basic
// plugin should include documentation / be canonical example
// plugin should require a paymail address for payment / registry information
