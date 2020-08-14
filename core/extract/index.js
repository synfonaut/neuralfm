const log = require("debug")("neuralfm:core:extract");

const database = require("../db").db;
/*
const plugins = require("../../plugins");
const utils = require("../../utils");
*/

async function extract(extractors, opts={}) {
    log("extracting");
    for (const extractor of extractors) {
        log(`extracting ${extractor.name}`);
        const dbname = extractor.dbname || extractor.name;
        const db = await database(dbname);
        const options = Object.assign({}, opts, { db });
        const results = await extractor(db, options);
        db.close();
        if (results && results.length > 0) {
            return results;
        }
    }
    return [];
}

module.exports = extract;

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
