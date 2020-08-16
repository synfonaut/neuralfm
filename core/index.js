const log = require("debug")("neuralfm:core:index");
const path = require("path");

const db = require("./db").db;

const plugins = require("../plugins");

const scrape = require("./scrape").scrape;
const extract = require("./extract").extract;
const normalize = require("./normalize").normalize;
const train = require("./train").train;
const Classifier = require("./classify").Classifier;

require("./compatibility");

module.exports = {
    // core
    db,
    Classifier,

    // plugins
    plugins,
    scrape,
    extract,
    normalize,
    train,
};

