const log = require("debug")("neuralfm:core:index");
const path = require("path");

const db = require("./db").db;

const plugins = require("../plugins");

const scrape = require("./scrape").scrape;
const extract = require("./extract").extract;
const normalize = require("./normalize").normalize;

require("./compatibility");

module.exports = {
    db,
    plugins,

    scrape,
    extract,
    normalize,
};

