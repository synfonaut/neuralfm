const log = require("debug")("neuralfm:core:index");
const path = require("path");

const db = require("./db").db;

const plugins = require("../plugins");

const scrape = require("./scrape").scrape;
const extract = require("./extract").extract;
const normalize = require("./normalize").normalize;

const network = require("./network");
const create = network.create;
const save = network.save;
const load = network.load
const train = network.train;
const calculate = network.calculate;

const Classifier = require("./classify").Classifier;

require("./compatibility");

module.exports = {
    // core
    db,
    create,
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

