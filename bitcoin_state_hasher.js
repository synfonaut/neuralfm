/**
 * Bitcoin State Hasher
 *
 * The purpose of this script is to hash the contents of the system and snapshot it to the BSV blockchain
 *
 * More granularity will be added over time, allowing users to sign their data while still offering easy onboarding
 */

const assert = require("assert");
const datapay = require("datapay");

const BITCOM_ADDRESS = "14QrE3CT11ohcgDmDTxazqu5Azb3TgFgah";

const core = require("./core");

const utils = require("./utils");
const glob = require("glob");

function getAllImportantFiles() {
  const mainFiles = glob.sync("*.js");
  const coreFiles = glob.sync("core/*.js");
  const pluginFiles = glob.sync("plugins/**/*.js");
  const files = mainFiles.concat(coreFiles).concat(pluginFiles);
  return files.filter(file => {
    return file.indexOf("test") == -1;
  });
}

async function getClassifications() {
  const classifications = await core.classifiers.Classifier.getAllClassifications();
  return classifications.map(classification => {
    return `${classification.name}-${classification.fingerprint}-${classification.classification}`;
  });
}

// TODO: Hacky..make proper exporter
async function getDataSources() {
  const classifications = await core.classifiers.Classifier.getAllClassifications();

  const fingerprints = classifications.map(classification => {
    return classification.fingerprint;
  });

  const dbname = core.plugins.scrapers.BSVTwitterScraper.getDatabaseName();
  const collectionName = core.plugins.scrapers.BSVTwitterScraper.getCollectionName();
  const db = await core.db(dbname);

  const data = await (db.collection(collectionName).find({ "fingerprint": {"$in": fingerprints}}).toArray());

  return data.map(d => {
    // TODO: Will this keep order? Should we sort the keys to get a deterministic hash?
    return JSON.stringify(d["twitter_features"]);
  });
}

(async function() {
  const files = getAllImportantFiles();
  const fileHashes = files.map(utils.hash);

  const classifications = await getClassifications();
  const classificationHashes = classifications.map(utils.hash);

  const data = await getDataSources();
  const dataHashes = data.map(utils.hash);

  const hashes = fileHashes.concat(classificationHashes); //.concat(dataHashes);

  const command = [BITCOM_ADDRESS, "|", "SET", "app", "neuralfm", "name", "neuralfm_system_hash", "ADD", "hashes"].concat(hashes);

  console.log(command);

  assert(process.env.PRIVATE_KEY);

  const privateKey = process.env.PRIVATE_KEY;
  datapay.send({
    safe: true,
    data: command,
    pay: { key: privateKey, feeb: 1.5 }
  }, function(err, txid) {
    console.log('err', err);
    console.log('txid', txid);
  });
})();

