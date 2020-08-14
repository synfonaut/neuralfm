
export function ok(response) {
    if (!response) return false;
    if (!response.result) return false;
    if (!response.result.ok) return false;
    return true;
}

export function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/*
export function good(response) {
    if (!response) return false;
    if (!response.result) return false;
    if (!response.result.ok) return false;
    if (response.result.n !== 1) return false;
    return true;
}

export function updated(response) {
    if (!response) return false;
    if (!response.result) return false;
    if (!response.result.ok) return false;
    if (response.result.n !== 1) return false;
    if (response.result.nModified !== 1) return false;
    return true;
}


export function dupe(e, keys=[]) {
    if (e.name !== "MongoError") {
        //console.log("wrong error during dupe", JSON.stringify(e, null, 4), keys);
        return false;
    }
    if (e.code !== 11000) {
        //console.log("wrong error code during dupe", JSON.stringify(e, null, 4), keys);
        return false;
    }

    if (e.keyPattern) {
        for (const key of keys) {
            if (!e.keyPattern[key]) {
                //console.log("wrong key pattern", key, "in keyPattern during dupe", JSON.stringify(e, null, 4), keys);
                return false;
            }
        }
    } else {
        for (const key of keys) {
            if (e.errmsg.indexOf(key) == -1) {
                //console.log("wrong key pattern", key, "in errmsg during dupe", JSON.stringify(e, null, 4), keys);
                return false;
            }
        }
    }

    return true;
}
*/
