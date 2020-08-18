const log = require("debug")("neuralfm:app:channel");

import React, { useState } from "react"
import { Error404Page } from "./error"

const core = require("../core");
const utils = require("../utils");

const DEFAULT_NETWORK_FINGERPRINT = "";

// this is hacky....but that's why they call it a hackathon
const networks = {};

export function Channel(args={}) {

  const [isLoading, setIsLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [channel, setChannel] = useState({});
  const [feed, setFeed] = useState([]);
  const [sort, setSort] = useState("created_at");
  const [isTraining, setIsTraining] = useState(false);
  const [classifications, setClassifications] = useState({});

  async function updateChannel(slug) {
    log("updating channel");
    setSlug(args.slug);
    setIsLoading(true);
    const chan = await core.channels.getBySlug(args.slug)
    if (chan) {
      const network = chan.network;
      delete chan.network;
      networks[chan.slug] = network;
      setChannel(chan);

      updateChannelFeed(chan.slug);

      setIsLoading(false);
    } else {
      setChannel({});
      setIsLoading(false);
    }
  }

  async function updateChannelFeed(slug, sortKey) {
    let newSort = sort;
    if (sort !== sortKey) {
      setSort(sortKey);
      newSort = sortKey;
    }

    const network = networks[slug]
    if (!network) {
      log(`cannot update channel feed, missing network on channel '${slug}'`);
      return;
    }

    log(`updating channel feed ${slug} ${newSort}`);
    const data = await network.normalizer.getDataCursor(newSort);
    const feedData = [];

    let feedItem;
    while (feedItem = await data.next()) {
      feedData.push(feedItem);
      if (feedData.length > 1000) {
        break;
      }
    }

    setFeed(feedData);

    const allClassifications = await network.classifier.getClassifications();
    const classifications = await network.classifier.getClassificationMapping(allClassifications)
    setClassifications(classifications);
  }

  async function handleClickTrain() {
    log(`training`);

    if (!channel || !channel.slug) {
      // TODO: display error
    }

    const network = networks[channel.slug];
    if (!network) {
      // TODO: display error
    }

    const oldFingerprint = network.fingerprint;

    setIsTraining(true);
    try {
      await core.networks.train(network);
    } catch (e) {
      throw e;
      // TODO: display error
    } finally {
      setIsTraining(false);
    }

    if (network.fingerprint !== oldFingerprint) {
      log(`network fingerprint has updated from ${oldFingerprint} to ${network.fingerprint}`);
      await core.networks.updateFingerprint(network.constructor, oldFingerprint, network.fingerprint);
      await core.channels.updateNetwork(channel.slug, network.fingerprint);
      updateChannel(channel.slug);
    }
  }

  async function handleClickClassify(fingerprint, value) {
    log(`classifying ${fingerprint} to ${value}`);
    const network = networks[channel.slug];
    try {
      await network.classifier.classify(fingerprint, value);
      log(`classified ${fingerprint} to ${value}`);
    } catch (e) {
      // TODO: display error
    }
  }

  async function handleClickSort(sortKey) {
    if (sort !== sortKey) {
      log(`sorting by ${sortKey}`);
      updateChannelFeed(channel.slug, sortKey);
    }
  }

  if (slug !== args.slug) {
    log(`updating channel data for ${args.slug}`);
    updateChannel(args.slug);
  }


  const params = Object.assign({}, args, {
    channel,
    classifications,
    handleClickTrain,
    handleClickClassify,
    handleClickSort,
    isTraining,
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

  const feedItems = feed || []; // TODO: for some reason caldera isn't using default state...can't debug now... hackathon

  return <div className="columns">
      <div className="column is-8">
          <h2 className="title">{channel.name}</h2>
          <div className="feed">
            {feedItems.map(item => {
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
  const channel = args.channel;
  const classifications = args.classifications || {};
  const network = networks[channel.slug]; // HACKY :(
  let prediction = 0;
  if (network) {
    const predictions = tweet.predictions || {};
    prediction = predictions[network.fingerprint] || 0;
  }

  const classification = classifications[tweet.fingerprint];

  return <div className="feed-item tweet">
    <div className="columns is-mobile">
      <div className="column is-2">
          <button className={"button is-small" + (classification && classification == 1 ? " is-primary" : "")}  onClick={() => { args.handleClickClassify(tweet.fingerprint, 1) } }>Up</button>
        <div className="prediction">
        {utils.round(prediction)}
        </div>
          <button className={"button is-small" + (classification && classification == -1 ? " is-primary" : "")}  onClick={() => { args.handleClickClassify(tweet.fingerprint, -1) } }>Down</button>
      </div>
      <div className="column is-10">
        <div className="screen_name">{tweet.user.screen_name}</div>
        {tweet.full_text}
      </div>
    </div>
  </div>
}

function RetweetFeedItem(args={}) {
  /*
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
  */
}

function QuoteTweetFeedItem(args={}) {
  /*
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
  */
}

export function ChannelSidebar(args={}) {
  let weightKeyName = "created_at";

  let networkFingerprint;
  const channel = args.channel

  const classifications = args.classifications || {};

  if (channel && channel.slug) {
    const network = networks[channel.slug];
    if (network) {
      networkFingerprint = network.fingerprint;
      weightKeyName = `predictions.${networkFingerprint}`;
    }
  }

  return <div id="sidebar">
        <p className="content">CHANNEL INFORMATION</p>
        <p className="content"><strong>NeuralFM</strong>'s mission is to put you in control of the AI's feeding you information.</p>
        {networkFingerprint && <p className="content">{networkFingerprint.split(":").join(" ")}</p>}

        <button className="button" onClick={args.handleClickTrain}>Train</button>
        {args.isTraining && <div>Training</div>}
        <a onClick={() => { args.handleClickSort(weightKeyName) }}>Weight</a>
        <a onClick={() => { args.handleClickSort("created_at") }}>Date</a>
        {Object.keys(classifications).map(fingerprint => {
            const classification = classifications[fingerprint];
            return <div key={fingerprint}>{fingerprint} {classification}</div>
        })}
    </div>
}


