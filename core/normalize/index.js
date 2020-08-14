const log = require("debug")("neuralfm:core:normalize");

const database = require("../db").db;
/*
const plugins = require("../../plugins");
const utils = require("../../utils");
*/

async function normalize(normalizers, opts={}) {
    log("normalizing");
    for (const normalizer of normalizers) {
        log(`normalizing ${normalizer.name}`);
        const dbname = normalizer.dbname || normalizer.name;
        const db = await database(dbname);
        const options = Object.assign({}, opts, { db });
        const results = await normalizer(db, options);
        db.close();
        if (results && results.length > 0) {
            return results;
        }
    }
    return [];
}

module.exports = normalize;

/*
if (require.main === module) {
    (async function() {
        const scrapers = Object.values(plugins.scrapers);
        let results;
        do {
            results = await scrape(scrapers);
            log("sleeping");
            await utils.sleep(1000);
        } while (results.length > 0);

        process.exit();
        //await scrape()
    })();

}
*/
