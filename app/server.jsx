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

function NeuralFMApplicationWrapper(args={}) {
    const [data, setData]  = useState([]);
    const [isLoaded, setIsLoaded]  = useState(true);

    if (!isLoaded) {
        setTimeout(function() {
            setIsLoaded(true);
        }, 1000);
    }

    const params = Object.assign({}, args, {
        isLoaded,
    });

    //getNewData().then(setData);

    return <>
        <LoadingScreen {...params} />
        <NeuralFMApplication {...params} />
    </>
};

function NeuralFMApplication(args={}) {
    return <div id="app" className={args.isLoaded ? "loaded" : "unloaded"}>
        <div className="columns">
            <div className="column">
                <Timeline {...args} />
            </div>
        </div>
    </div>
}

function Timeline(args) {
    return <div id="timeline">
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
        timeline<br />
    </div>
}

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

renderCalderaApp(<NeuralFMApplicationWrapper />, {
    port: 7777,
    rootDir: "./app/public"
});

