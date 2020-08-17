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
    const chnl = await core.channels.getBySlug(args.slug)
    if (chnl) {
      const network = chnl.network;
      chnl.network = await network.toJSON();
      setChannel(chnl);

      // TODO: add pagination & sorting
      const data = await network.normalizer.getDataCursor();
      const feedData = [];

      let feedItem;
      while (feedItem = await data.next()) {
        feedData.push(feedItem);
        if (feedData.length > 200) {
          break;
        }
      }

      setFeed(feedData);
      setIsLoading(false);
    } else {
      network = null;
      setChannel({});
      setIsLoading(false);
    }
  }

  if (slug !== args.slug) {
    log(`updating channel data ${args.slug}`);
    updateChannel(args.slug);
  }


  const params = Object.assign({}, args, {
    channel,
  });

  if (!channel || !channel.name) {
    return <div className="columns">
        <div className="column is-8">
            <h2 className="title"></h2>
            {isLoading && <div className="block-loader">
              <div className="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
            </div>}
            {!isLoading && <p className="content">Unable to find channel <strong>{params.slug}</strong></p>}
        </div>
        <div className="column is-4">
            <ChannelSidebar {...params} />
        </div>
    </div>
  }

  return <div className="columns">
      <div className="column is-8">
          <h2 className="title">{channel.name}</h2>
          <div className="feed">
            {feed.map(item => {
              return <FeedItem key={item.fingerprint} item={item} {...params} />
            })}
          </div>
      </div>
      <div className="column is-4">
          <ChannelSidebar {...params} />
      </div>
  </div>

}

function FeedItem(args={}) {
  const item = args.item;
  return <TweetFeedItem {...args} />

  if (item.quoted_status) {
    return <QuoteTweetFeedItem {...args} />
  } else if (item.retweeted_status) {
    return <RetweetFeedItem {...args} />
  } else if (item.full_text) {
    return <TweetFeedItem {...args} />
  } else {
    log(`unknown feed item ${args.fingerprint}`);
  }
}

function TweetFeedItem(args={}) {
  const tweet = args.item;
  const network = args.channel.network;
  const predictions = tweet.predictions || {};
  const prediction = predictions[network.fingerprint] || 0;

  return <div className="feed-item tweet">
    <div className="columns is-mobile">
      <div className="column is-1">
        <div className="prediction">
        {prediction}
        </div>
      </div>
      <div className="column is-2">
        {tweet.user.screen_name}
      </div>
      <div className="column is-9">
        {tweet.full_text}
      </div>
    </div>
  </div>
}

function RetweetFeedItem(args={}) {
  const predictions = args.item.predictions || {};
  const prediction = predictions[args.channel.network.fingerprint] || 0;
  return <div className="feed-item tweet">
    <div className="columns is-mobile">
      <div className="column is-3">
        <div className="prediction">
        {prediction}
        </div>
      </div>
      <div className="column is-9">
        {args.item.full_text}
      </div>
    </div>
  </div>
}

function QuoteTweetFeedItem(args={}) {
  const predictions = args.item.predictions || {};
  const prediction = predictions[args.channel.network.fingerprint] || 0;
  return <div className="feed-item tweet">
    <div className="columns is-mobile">
      <div className="column is-3">
        <div className="prediction">
        {prediction}
        </div>
      </div>
      <div className="column is-9">
        {args.item.full_text}
      </div>
    </div>
  </div>
}

export function ChannelSidebar(args={}) {
  return <div id="sidebar">
        <p className="content">CHANNEL INFORMATION</p>
        <p className="content"><strong>NeuralFM</strong>'s mission is to put you in control of the AI's feeding you information.</p>

    </div>
}


