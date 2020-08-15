const log = require("debug")("neuralfm:core:db");

const MongoClient = require("mongodb");

let numconnections = 0;
let debugConnectionsInterval = null;
let connurl = "mongodb://localhost:27017";

//let databaseConnection = null;
let databaseConnections = new Map();

function db(dbname=null) {
    if (debugConnectionsInterval === null) {
        debugConnectionsInterval = setInterval(function() {
            log(`${numconnections} connections`);
        }, 1000 * 60);
    }
    return new Promise((resolve, reject) => {
        if (!dbname) {
            return reject("invalid db name");
        }

        let databaseConnection = databaseConnections.get(dbname);
        if (databaseConnection) {
            return resolve(databaseConnection);
        }

        MongoClient.connect(connurl, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
            if (err) {
                setTimeout(function() {
                    log(`retrying ${dbname} db connection...`);
                    connect().then(resolve);
                }, 1000);
            } else {
                numconnections += 1;
                //log(`${numconnections} // connected`);
                log(`connecting to ${dbname} db...`);
                databaseConnection = client.db(dbname);
                databaseConnection.close = function() {
                    log(`closing ${dbname} db connection...`);
                    numconnections -= 1;
                    const connectedClient = databaseConnections.get("dbname") || null;
                    if (connectedClient) {
                        connectedClient.close();
                    }

                    databaseConnections[dbname] = null;
                }

                databaseConnections[dbname] = databaseConnection;
                resolve(databaseConnection);
            }
        });
    });
};

module.exports = {
    db,
};
