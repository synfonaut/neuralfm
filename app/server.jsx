import React, { useState } from "react"
import { renderCalderaApp, makeSharedResource, useSharedState, useLocation, useHistory } from "caldera"

// TODO: Get data....display it....you know what to do... good luck ☕️ 👍

function getNewData() {
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            resolve(["A", "B", "C"]);
        }, 2000);
    });
}

const NeuralFMApplication = (params={}) => {

    const [data, setData]  = useState([]);

    getNewData().then(setData);

    return <div>

        BEFORE
        {data.map(d => {
            return d;
        })}
            AFTER
    </div>
    /*
    return new Promise((resolve, reject) => {
        resolve(<div>RENDERER</div>);
    });
    */
};

renderCalderaApp(<NeuralFMApplication />, {
    port: 4000,
    rootDir: "./app/public"
});

