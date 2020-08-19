const log = require("debug")("neuralfm:app:channel");

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const Linkify = require("linkifyjs/react");

import React, { useState } from "react"
import { Error404Page } from "./error"

const core = require("../core");
const utils = require("../utils");

const DEFAULT_NETWORK_FINGERPRINT = "";

// this is hacky....but that's why they call it a hackathon
const networks = {};

export function Channel(args={}) {

  const MAX_ITERATIONS = 300;
  const MAX_DATA_LENGTH = 200;

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
    setFeed([]);
    setClassifications({});
    setChannel({ slug });

    const chan = await core.channels.getBySlug(args.slug)
    if (chan) {
      const network = chan.network;
      delete chan.network;
      networks[chan.slug] = network;
      setChannel(chan);

      const sortKey = `predictions.${network.fingerprint}`;

      updateChannelFeed(chan.slug, sortKey);
    } else {
      setChannel({});
      setIsLoading(false);
    }
  }

  async function updateChannelFeed(slug, sortKey) {
    let newSort = sort;
    if (sortKey && sort !== sortKey) {
      newSort = sortKey;

      setSort(sortKey);
    }

    // hack hack hack hacky hack
    const sortDirections = {
      "created_at": 1,
    };

    let direction = sortDirections[newSort];
    if (typeof direction === "undefined") {
      direction = -1;
    }

    const network = networks[slug]
    if (!network) {
      log(`cannot update channel feed, missing network on channel '${slug}'`);
      return;
    }

    log(`updating channel feed ${slug} ${newSort} ${direction}`);
    const data = await network.normalizer.getDataCursor(newSort, direction, network.fingerprint, -0.3);
    const feedData = [];

    setFeed(feedData);
    setIsLoading(true);
    let feedItem, maxIterations = MAX_ITERATIONS, maxDataLength = MAX_DATA_LENGTH;
    while (feedItem = await data.next()) {
      const predictions = feedItem.predictions || {};
      const prediction = predictions[network.fingerprint] || 0;

      feedData.push(feedItem);


      if (feedData.length > maxDataLength || maxIterations-- <= 0) {
        break;
      }
    }

    log(`updating channel feed ${slug} with ${feedData.length} data`);
    setFeed(feedData);
    setIsLoading(false);

    await updateClassifications(network);
  }

  async function updateClassifications(network) {
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

    const network = networks[channel.slug];
    if (classifications[fingerprint] && classifications[fingerprint] == value) {
      log(`unclassifying ${fingerprint}`);
      try {
        await network.classifier.unclassify(fingerprint);
        log(`unclassified ${fingerprint} from ${value}`);
        await updateClassifications(network);
      } catch (e) {
        // TODO: display error
      }
    } else {
      log(`classifying ${fingerprint} to ${value}`);
      try {
        await network.classifier.classify(fingerprint, value);
        log(`classified ${fingerprint} to ${value}`);
        await updateClassifications(network);
      } catch (e) {
        // TODO: display error
      }
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

  if (args.sidebar === false) {
    return <div className="columns">
        <div className="column is-12">
            <h2 className="title">{channel.name}</h2>
            <div className="feed">
              {(feedItems.length === 0 && isLoading) && <div className="block-loader">
                <div className="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
              </div>}
              {feedItems.map(item => {
                return <FeedItem key={item.fingerprint} item={item} {...params} />
              })}
            </div>
        </div>
    </div>
  } else {
    return <div className="columns">
        <div className="column is-8">
            <div className="columns">
              <div className="column is-8">
                <h2 className="title">{channel.name}</h2>
              </div>
              <div className="column is-4">
                <Sort {...params} />
              </div>
            </div>

            <div className="feed">
              {(feedItems.length === 0 && isLoading) && <div className="block-loader">
                <div className="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
              </div>}
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
    <div className="columns is-mobile is-vcentered">
      <div className="column is-2 has-text-centered">
          <button className={"vote-button button is-small" + (classification && classification == 1 ? " is-primary-classification" : "")}  onClick={() => { args.handleClickClassify(tweet.fingerprint, 1) } }>
            <img src="/arrow-alt-up-solid.svg" alt="Up Arrow" className="arrow up-arrow" />
          </button>
        <div className="prediction">
          {utils.round(prediction * 100, 0)}%
        </div>
          <button className={"vote-button button is-small" + (classification && classification == -1 ? " is-primary-classification" : "")}  onClick={() => { args.handleClickClassify(tweet.fingerprint, -1) } }>
            <img src="/arrow-alt-down-solid.svg" alt="Down Arrow" className="arrow down-arrow" />
          </button>
      </div>
      <div className="column is-10">
        <div className="screen_name"><a target="_blank" className="has-text-white" href={`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`}>@{tweet.user.screen_name}</a></div>
        <Linkify>{entities.decode(tweet.full_text)}</Linkify>
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

export function Sort(args={}) {
  let weightKeyName = "created_at";

  let networkFingerprint;
  const channel = args.channel

  if (channel && channel.slug) {
    const network = networks[channel.slug];
    if (network) {
      networkFingerprint = network.fingerprint;
      weightKeyName = `predictions.${networkFingerprint}`;
    }
  }

  return <div className="sort has-text-right">
    <span><strong>Sort by</strong>&nbsp;</span>
    <a className="sort-link" onClick={() => { handleClickSort(weightKeyName) }}>Weight</a>
    <a className="sort-link" onClick={() => { handleClickSort("created_at") }}>Date</a>
  </div>
}

export function ChannelSidebar(args={}) {
  return <div id="sidebar">
        <p className="content">This is the latest and greatest <strong>{args.channel.name}</strong> information.</p>
        <p className="content"><strong>NeuralFM</strong>'s mission is to put you in control of the AI's feeding you information. Vote on stories, then <strong>Train</strong> the model to see the updated results.</p>
        {/*networkFingerprint && <p className="content">{networkFingerprint.split(":").join(" ")}</p>*/}

        <div className="columns">
          <div className="column is-2">
            <button className="button" onClick={args.handleClickTrain}>Train</button>
          </div>
          <div className="column is-8">
            {args.isTraining && <div className="training-text">Training</div>}
            {!args.isTraining && <div></div>}
          </div>
        </div>
        <Classifications {...args} />
    </div>
}


export function Classifications(args={}) {
  const classifications = args.classifications || {};

  if (Object.keys(classifications).length > 0) {
    return <div>
      <table className="classifications table">
        {Object.keys(classifications).map(fingerprint => {
            const classification = classifications[fingerprint];
            return <tr key={fingerprint}>
              <td className="classification">
                {classification == 1 && <img src="/arrow-alt-up-solid.svg" alt="Up Arrow" className="arrow up-arrow" />}
                {classification == -1 && <img src="/arrow-alt-down-solid.svg" alt="Down Arrow" className="arrow down-arrow" />}
              </td>
              <td className="fingerprint">{fingerprint}</td>
            </tr>
        })}
      </table>
    </div>
  } else {
    return null;
  }
}

