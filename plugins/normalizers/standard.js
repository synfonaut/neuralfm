const log = require("debug")("neuralfm:plugins:normalizers:standard");

const utils = require("../../utils");
const database = require("../../core/db").db;

const mimir = require("mimir");
const bow = mimir.bow;
const dict = mimir.dict;

export class StandardFeatureNormalizer {
    constructor(db, scraper, extractor, opts={}) {
        if (!db) { throw "expected db" }
        this.db = db;

        if (!scraper) { throw "expected scraper" }
        this.scraper = scraper;

        if (!extractor) { throw "expected extractor" }
        this.extractor = extractor;

        this.name = `${this.scraper.constructor.name}:${this.extractor.constructor.name}:${StandardFeatureNormalizer.name}`;
    }

    // two potential areas of exploration
    //  - getDataSource -> ideally optimize this one first...
    //  - getOrCreateMetadata...
    async run() {
        const data = await this.getDataSource();
        const normalizedFieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);
        const unnormalizedData = [];
        const recentlyNormalizedData = [];

        for (const row of data) {
            if (!row[normalizedFieldName]) {
                unnormalizedData.push(row);
            }
        }

        const normalizationMetadata = await this.getOrCreateMetadata(data);

        if (unnormalizedData.length > 0) {
            log(`detected ${unnormalizedData.length} ${this.scraper.constructor.name}:${this.extractor.constructor.name} features that need normalization`);

            for (const unnormalized of unnormalizedData) {
                recentlyNormalizedData.push(await this.updateNormalizationValues(unnormalized[this.extractor.constructor.getFeaturesFieldName()], normalizationMetadata));
            }
        } else {
            log(`no features need normalizing from ${this.scraper.constructor.name}:${this.extractor.constructor.name}`);
        }

        return recentlyNormalizedData;
    }

    async getMetadata() {
        const normalizedFieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);
        return await this.db.collection(StandardFeatureNormalizer.getCollectionName()).findOne({ _name: normalizedFieldName });
    }

    async getOrCreateMetadata(data) {
        let normalizationMetadata = await this.getMetadata();
        if (normalizationMetadata) {
            log(`found existing normalization metdata`);
        } else {
            log(`missing normalization metdata... generating`);
            normalizationMetadata = await this.createNormalizationMetadata(data);
        }

        return normalizationMetadata;
    }

    async getDataSource() {
        return await (await this.extractor.getDataCursor()).sort({"created_at": -1}).toArray();
    }

    // TODO: pagination
    async getDataCursor(sortKey="created_at", sortDirection=1) {
        const fieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);
        const collectionName = this.scraper.constructor.getCollectionName();
        const findQuery = {};
        findQuery[fieldName] = {"$exists": true};

        const sortQuery = {};
        sortQuery[sortKey] = sortDirection;

        return await this.db.collection(collectionName).find(findQuery).sort(sortQuery);
    }

    async getDataStream() {
        const fieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);
        const collectionName = this.scraper.constructor.getCollectionName();
        const findQuery = {};
        findQuery[fieldName] = {"$exists": true};
        return await this.db.collection(collectionName).find(findQuery).sort({"created_at": -1}).stream();
    }

    async updateNormalizationValues(unnormalized, metadata) {
        log(`normalizing ${unnormalized.fingerprint}`);

        const normalized = {
            fingerprint: unnormalized.fingerprint,
        };

        delete unnormalized["fingerprint"];

        for (const key in metadata) {
            if (key.indexOf("_") === 0) { continue }
            const keymeta = metadata[key];
            if (keymeta.type == "numeric" || keymeta.type == "date") {
                normalized[key] = normalizeValue(unnormalized[key], keymeta.minmax[0], keymeta.minmax[1]);
            } else if (keymeta.type == "string") {
                normalized[key] = bagofwords(unnormalized[key], keymeta.vector);
            } else {
                throw new Error(`unknown metadata key '${key}' type=${keymeta.type}`);
            }
        }

        const fieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);
        const setQuery = {"$set": {}};
        setQuery["$set"][fieldName] = normalized;

        const response = await this.db.collection(this.scraper.constructor.getCollectionName()).updateOne({"fingerprint": normalized.fingerprint}, setQuery);
        if (!utils.ok(response)) {
            log(`error updating normalization values for ${normalized.fingerprint} - ${response}`);
        }

        return normalized;
    }

    async createNormalizationMetadata(rows) {
        log(`generating normalization metadata for ${rows.length} ${this.scraper.constructor.name}:${this.extractor.constructor.name} data`);

        let keymapping = new Map();

        const normalizedFieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);
        const featureKeyName = this.extractor.constructor.getFeaturesFieldName();
        for (const row of rows) {
            const features = row[featureKeyName];
            for (const key in features) {
                if (key === "fingerprint") { continue }

                const val = features[key];
                if (typeof val === "number") {
                    keymapping.set(key, "numeric");
                } else if (typeof val == "object" && val instanceof Date) {
                    keymapping.set(key, "date");
                } else if (typeof val == "string") {
                    keymapping.set(key, "string");
                } else {
                    throw new Error(`unknown metadata key ${key}`);
                }
            }
        }

        const keys = new Map([...keymapping.entries()].sort());

        const metadata = {};

        for (const [key, keytype] of keys) {
            const values = rows.map(row => { return row[featureKeyName][key] });
            if (keytype == "numeric") {
                const numericValues = values.map(Number);
                const valueMinMax = minmax(numericValues);
                metadata[key] = { type: keytype, minmax: valueMinMax };
            } else if (keytype == "date") {
                const valueMinMax = minmax(values);
                metadata[key] = { type: keytype, minmax: valueMinMax };
            } else if (keytype == "string") {
                const vector = wordvector(values);
                metadata[key] = { type: keytype, vector };
            } else {
                throw new Error(`unknown metadata key '${key}' type=${keytype}`);
            }
        }

        metadata["_name"] = normalizedFieldName;

        await this.db.collection(StandardFeatureNormalizer.getCollectionName()).insertOne(metadata);

        return metadata;
    }

    async getTrainingData(classifier) {
        const classificationMapping = await classifier.getClassificationMapping();

        const fingerprints = [];
        for (const classificationFingerprint in classificationMapping) {
            fingerprints.push(classificationFingerprint);
        }

        const rows = await this.extractor.getDataByFingerprints(fingerprints);

        const fieldName = StandardFeatureNormalizer.getNormalizedFieldName(this.extractor);

        const trainingData = [];

        for (const row of rows) {
            const normalizedData = row[fieldName];
            const classificationValue = classificationMapping[normalizedData.fingerprint];

            // only handle training data with classification data
            if (typeof classificationValue !== "undefined") {
                const fingerprint = normalizedData.fingerprint;

                const normalizedInput = StandardFeatureNormalizer.convertToTrainingDataInput(normalizedData);

                log(`created training data on ${fingerprint} from ${this.name} with ${normalizedInput.length} inputs and 1 output`);

                trainingData.push({
                    fingerprint,
                    input: normalizedInput,
                    output: [classificationValue],
                });
            }
        }

        log(`created ${trainingData.length} training data from ${this.name}`);

        return trainingData;
    }

    static convertToTrainingDataInput(normalizedData) {
        delete normalizedData["fingerprint"];
        const keys = Object.keys(normalizedData).sort();

        const values = keys.map(key => {
            const value = normalizedData[key];
            if (typeof value == "number") {
                return [value]
            }
            return value;
        });

        const normalizedInput = [].concat.apply([], values);
        return normalizedInput;
    }

    static getNormalizedFieldName(extractor) {
        return this.getNormalizedFieldNameWithExtractorFieldName(extractor.constructor.getFeaturesFieldName());
    }

    // TODO: Hacky...make proper
    static getNormalizedFieldNameWithExtractorFieldName(extractorFieldName) {
        return `${extractorFieldName}_normalized`;
    }

    static getCollectionName() {
        return "standard_normalizer_metadata";
    }

    static async createIndexes(db) {
        await db.collection(this.getCollectionName()).createIndex({ "_name": 1 }, {"unique": true});
    }

    static async createNormalizationFieldIndexes(db, extractor) {
        const normalizedFieldName = this.getNormalizedFieldNameWithExtractorFieldName(extractor.getFeaturesFieldName());
        const createIndexQuery = {};

        createIndexQuery[normalizedFieldName] = 1;

        await db.collection(this.getCollectionName()).createIndex(createIndexQuery);
    }

    static async resetDatabase(dbname) {
        const db = await database(dbname);
        await db.collection(this.getCollectionName()).deleteMany({});
        await this.createIndexes(db);
        db.close();
    }
}

export function minmax(rows, minimum=null, maximum=null) {
    let min = Infinity, max = -Infinity;
    for (const row of rows) {
        if (row < min) {
            min = row;
        }
        if (row > max) {
            max = row;
        }
    }

    if (minimum !== null) {
        if (min < minimum) { min = minimum }
        if (max < minimum) { max = minimum }
    }

    if (maximum !== null) {
        if (min > maximum) { min = maximum }
        if (max > maximum) { max = maximum }
    }

    return [min, max];
}

export function normalizeValue(val, min, max) {
    if (val < min) { val = min }
    if (val > max) { val = max }

    const value = (val - min) / (max - min);

    return (isNaN(value) ? min : value);
}

export function normalizeValues(arr, min, max) {
    return arr.map((value) => { return normalizeValue(value, min, max) });
}

export function wordvector(rows) {
    const cleanedRows = rows.map(cleanText);
    cleanedRows.sort((a, b) => { return a.localeCompare(b) });
    return dict(cleanedRows);
}

export function cleanText(text) {
    let cleanedText = text;

    cleanedText = cleanTextLinks(cleanedText);
    cleanedText = cleanTextUsernames(cleanedText);

    // replace any leftover non-alphanumeric chars with spaces
    cleanedText = cleanedText.replace(/[^a-zA-Z0-9_]+/g, " ").trim();

    return cleanedText;
}

export function cleanTextLinks(text) {
    let cleanedText = text;
    let inlineText = text.replace(/\n/g, " ");

    const urls = inlineText.match(/(https?:\/\/[^ ]*)/g);
    if (urls) {
        for (const url of urls) {
            const parts = url.split(/[^a-zA-Z0-9\.]+/);
            const splitURL = parts.join(" ");
            cleanedText = cleanedText.replace(url, splitURL);
        }
    }

    return cleanedText;
}

export function cleanTextUsernames(text) {
    let cleanedText = text;

    const usernames = cleanedText.match(/@[a-zA-Z0-9_]+/g);
    if (usernames) {
        for (const username of usernames) {
            const cleanedUsername = cleanUsername(username);
            cleanedText = cleanedText.replace(username, cleanedUsername);
        }
    }

    return cleanedText;
}

export function cleanUsername(username) {
    let cleanedUsername = username.replace("@", "");
    cleanedUsername = cleanedUsername.replace(/\_/g, "BOWUS");
    return cleanedUsername;
}

export function bagofwords(text, vector) {
    const cleanedText = cleanText(text);
    const results = bow(cleanedText, vector);
    const mm = minmax(results);
    const normal = normalizeValues(results, mm[0], mm[1]);
    return normal;
}
