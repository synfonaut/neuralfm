const log = require("debug")("neuralfm:core:index");
const path = require("path");

const db = require("./db").db;

const plugins = require("../plugins");

const scrape = require("./scrape");
const extract = require("./extract");
const normalize = require("./normalize");

module.exports = {
    db,
    plugins,

    scrape,
    extract,
    normalize,
};

