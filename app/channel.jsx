const log = require("debug")("neuralfm:app:channel");

import React, { useState } from "react"
import { Error404Page } from "./error"

const core = require("../core");

const DEFAULT_NETWORK_FINGERPRINT = "";

export function Channel(args={}) {

  const [slug, setSlug] = useState("");
  const [channel, setChannel] = useState({});
  const [isInvalidChannel, setIsInvalidChannel] = useState(false);

  if (slug !== args.slug) {
    log(`updating channel data ${args.slug}`);
    setSlug(args.slug);
    core.channels.getBySlug(args.slug).then(updatedChannel => {
      if (updatedChannel) {
        delete updatedChannel.network;
        setChannel(updatedChannel);
      } else {
        setChannel({});
        setIsInvalidChannel(true);
      }
    });
  }

  if (!channel || !channel.name) {
    return <div id="channel">
        <h2 className="title"></h2>
        {!isInvalidChannel && <div className="block-loader">
          <div className="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
        </div>}
        {isInvalidChannel && <p className="content">Unable to find channel <strong>{args.slug}</strong></p>}
      </div>
  }

  return <div id="channel">
      <h2 className="title">{channel.name}</h2>
        <p className="content">{channel.network_fingerprint}</p>
    </div>

}

export function ChannelSidebar(args={}) {
  return <div id="sidebar">
        <p className="content">CHANNEL INFORMATION</p>
        <p className="content"><strong>NeuralFM</strong>'s mission is to put you in control of the AI's feeding you information.</p>

    </div>
}


