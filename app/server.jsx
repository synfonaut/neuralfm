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
    const [isLoaded, setIsLoaded]  = useState(false);

    if (!isLoaded) {
        setTimeout(function() {
            setIsLoaded(true);
        }, 1000);
    }

    const args = Object.assign({}, params, {
        isLoaded,
    });

    getNewData().then(setData);

    return <div>
        <LoadingScreen {...args} />
        <input type="button" value="CLICK" />
    </div>
};

function LoadingScreen(args={}) {
  return <div id="loading" className={args.isLoaded ? "loaded" : "unloaded"}>
    <div className="columns is-vcentered">
      <div className="column has-text-centered">
        <p className="bd-notification is-primary breathe">NeuralFM</p>
        <p className="is-size-6 breathe">Loading...</p>
      </div>
    </div>
  </div>
}

renderCalderaApp(<NeuralFMApplication />, {
    port: 7777,
    rootDir: "./app/public"
});

