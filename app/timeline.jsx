import React, { useState } from "react"

const core = require("../core");

const DEFAULT_NETWORK_FINGERPRINT = "";

export function Timeline(args) {

    const [channels, setChannels] = useState([]);
    core.channels.getTop().then(setChannels);


    return <div id="timeline">
        <h2 className="title">Top News</h2>
        <p className="content">
        {channels.map(channel => {
            return <div key={channel.name}>
                {channel.name} - {channel.network_fingerprint}
            </div>
        })}
        </p>
    </div>
}


