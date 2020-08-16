const log = require("debug")("neuralfm:core:classify");
const database = require("../db").db;
const config = require("../../config");
const utils = require("../../utils");

export class Classifier {
    constructor(name) {
        if (!name) { throw "expected name" }
        this.name = name;
    }

    async classify(fingerprint, classification) {
        if (classification < -1 || classification > 1) {
            throw "expected classification to be between -1 and 1";
        }

        const db = await database(Classifier.getDatabaseName());
        log(`classifying ${this.name} ${fingerprint} to ${classification}`);

        const created_date = new Date();
        try {
            await db.collection(Classifier.getCollectionName()).insert({
                name: this.name,
                fingerprint,
                classification,
                created_date,
            });
        } catch (e) {
            if (e.writeErrors && e.writeErrors[0].err.code == 11000) {
                log(`already classified ${this.name} ${fingerprint}`);
            } else {
                throw e;
            }
        } finally {
            db.close();
        }
    }

    async unclassify(fingerprint) {
        log(`unclassifying ${this.name} ${fingerprint}`);
        const db = await database(Classifier.getDatabaseName());
        await db.collection(Classifier.getCollectionName()).deleteOne({
            name: this.name,
            fingerprint,
        });
        db.close();
    }

    async getClassifications() {
        const db = await database(Classifier.getDatabaseName());
        const classifications = await (db.collection(Classifier.getCollectionName()).find({ name: this.name }).toArray());
        db.close();
        return classifications;
    }

    static getCollectionName() {
        return "classifications";
    }

    static getDatabaseName() {
        return config.databaseName;
    }

    static async createIndexes(db) {
        await db.collection(Classifier.getCollectionName()).createIndex({ "name": 1, "fingerprint": 1 }, {"unique": true});
    }
}

