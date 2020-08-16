const log = require("debug")("neuralfm:core:index");
const path = require("path");

const db = require("./db").db;

const plugins = require("../plugins");

const scrape = require("./scrape").scrape;
const extract = require("./extract").extract;
const normalize = require("./normalize").normalize;

const network = require("./network");
const train = network.train;
const load = network.load
const save = network.save;
const calculate = network.calculate;

const Classifier = require("./classify").Classifier;

require("./compatibility");

module.exports = {
    // core
    db,
    save,
    load,
    train,
    calculate,
    network,
    Classifier,

    // plugins
    plugins,
    scrape,
    extract,
    normalize,
};

