const log = require("debug")("neuralfm:core:index");
const path = require("path");

const db = require("./db").db;

const plugins = require("../plugins");

const scrape = require("./scrape").scrape;
const extract = require("./extract");
const normalize = require("./normalize");

// connections
for (const scraper of Object.values(plugins.scrapers)) {
    if (!scraper.compatibleExtractors) {
        scraper.compatibleExtractors = [];
    }
}

for (const extractor of Object.values(plugins.extractors)) {
    if (!extractor.compatibleNormalizers) {
        extractor.compatibleNormalizers = [];
    }
}

plugins.scrapers.BSVTwitterScraper.compatibleExtractors.push(plugins.extractors.TwitterFeatureExtractor);

module.exports = {
    db,
    plugins,

    scrape,
    extract,
    normalize,
};

