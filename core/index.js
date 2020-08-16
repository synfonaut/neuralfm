const log = require("debug")("neuralfm:core:index");
const path = require("path");

const db = require("./db").db;

const plugins = require("../plugins");

const scrape = require("./scrape").scrape;
const extract = require("./extract").extract;
const normalize = require("./normalize").normalize;

const train = require("./network").train;
const load = require("./network").load

const Classifier = require("./classify").Classifier;

require("./compatibility");

module.exports = {
    // core
    db,
    Classifier,
    train,
    save,
    load,

    // plugins
    plugins,
    scrape,
    extract,
    normalize,
};

