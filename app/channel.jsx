const log = require("debug")("neuralfm:app:channel");

import React, { useState } from "react"
import { Error404Page } from "./error"

const core = require("../core");

const DEFAULT_NETWORK_FINGERPRINT = "";

export function Channel(args={}) {

  const [isLoading, setIsLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [channel, setChannel] = useState({});
  const [feed, setFeed] = useState([]);

  async function updateChannel(slug) {
    setSlug(args.slug);
    setIsLoading(true);
    const chnnl = await core.channels.getBySlug(args.slug)
    if (chnnl) {
      const network = chnnl.network;
      delete chnnl.network;
      setChannel(chnnl);

      // TODO: add pagination
      const data = await network.normalizer.getDataSource();
      setFeed(data);
      setIsLoading(false);
    } else {
      setChannel({});
      setIsLoading(false);
    }
  }

  if (slug !== args.slug) {
    log(`updating channel data ${args.slug}`);
    updateChannel(args.slug);
  }

  if (!channel || !channel.name) {
    return <div className="columns">
        <div className="column is-8">
            <h2 className="title"></h2>
            {isLoading && <div className="block-loader">
              <div className="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
            </div>}
            {!isLoading && <p className="content">Unable to find channel <strong>{args.slug}</strong></p>}
        </div>
        <div className="column is-4">
            <ChannelSidebar {...args} />
        </div>
    </div>
  }

  return <div className="columns">
      <div className="column is-8">
          <h2 className="title">{channel.name}</h2>
          <p className="content">{channel.network_fingerprint}</p>
          <div className="feed">
            {feed.map(item => {
              console.log("TEXT", item.text);
              return <FeedItem item={item} {...args} />
            })}
          </div>
      </div>
      <div className="column is-4">
          <ChannelSidebar {...args} />
      </div>
  </div>

}

function FeedItem(args={}) {
  console.log("ITEM", args.item);
  return <div className="feed-item">
    {args.item.text}
  </div>
}

function TweetFeedItem(args={}) {
  return <div className="feed-item">
    {args.item.text}
  </div>
}

export function ChannelSidebar(args={}) {
  return <div id="sidebar">
        <p className="content">CHANNEL INFORMATION</p>
        <p className="content"><strong>NeuralFM</strong>'s mission is to put you in control of the AI's feeding you information.</p>

    </div>
}


