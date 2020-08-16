

                     _   _                      _  _________  ___
                    | \ | |                    | | |  ___|  \/  |
                    |  \| | ___ _   _ _ __ __ _| | | |_  | .  . |
                    | . ` |/ _ \ | | | '__/ _` | | |  _| | |\/| |
                    | |\  |  __/ |_| | | | (_| | |_| |   | |  | |
                    \_| \_/\___|\__,_|_|  \__,_|_(_)_|   \_|  |_/
                                                                 
                             Intelligence For Your Life                                                         


# NeuralFM

NeuralFM's mission is to put you in control of the AI's feeding you information.

Say goodbye to factory farmed algorithms from megacorps that destroy your life. NeuralFM offers a novel solution to the biggest invisible: algorithm bias.

Some Google engineer is probably going to decide the next President of the United States. It's bad enough when megacorps purposefully bias algorithms (it really is). What's shocking though, is even with small algorithms, and even when unintended, human bias infects AI. Even worse, AI are "black boxes"—many of the creators don't fully understand what's happening inside.

Neural Networks ("AI") are shaping your reality, but they're increasingly out-of-reach. AI is too powerful be left to the megacorps.

NeuralFM puts an AI in your pocket and it puts you in control. It creates an open market for the best AI for all the information channels you care about. And it puts everything on the blockchain, so you can be sure about exactly what's going into your algorithms.

Now, you might be thinking.... creating your own AI sounds pretty difficult... But it's not! In fact you'd be shocked how easy it is.


Creating an AI in NeuralFM is as simple as clicking a button. Seriously, that's it.

NerualFM is three things:
- An information feed giving you the best information on topics you care about
- A radio station to discover channels from the best curators
- A neural studio, to create your own AI with a few clicks (or modify someone else's)

Try it out -> https://neural.fm

## Getting Started

    git clone ...

    npm install

## Creating Plugins

If you're a developer, you may be interested in doing more than just classification, you may be interested in adding new data sources, training on different features, normalizing in a different way, or using a different neural network.

Plugins are easy to build, they're just Javascript functions: they come in 4 types

1. Scrapers
2. Feature Extractors
3. Normalizers
4. Networks

To create a new plugin, view the existing plugins and copy it to your new plugin filename.

Replace all the metadata like `description`, `author` and `paymail` with your information.

Test your code locally, and when you're ready, submit it to the NeuralFM market.

You can offer your plugin for free or charge. Welcome to the NeuralFM AI Marketplace.

What are the different plugins you can build?


### Scrapers

Scrapers pull in data to the system. Here's an example of a simple scraper:

```function SimpleScraper() {
    return [{"tweet": "just include some data"}, {"tweet": "and return a list of JSON objects", num_likes: 200}];
}```

Scrapers will be exposed a DB they can store state and only update what's needed.

### Feature Extractors

Feature Extractors decide which parts of the data are important.

```function SimpleFeatureExtractor(data) {
    return data.map(function(d) {
        return {
            "tweet": d.tweet,
            "num_likes": d.num_likes || 0,
        };
    });
}```

// TODO: You will get a core object that contains a DB you can use to store state and only update what's necessary
// TODO: Each data should return a fingerprint, or a hash of the data will be the fingerprint. bonus points for using bitcoin txids as fingerprints

### Normalizers

Normalizers convert those data features into a similar format.

```function SimpleNormalizer(data) {
    const words = bagofwords(data.map(d => { return d.tweet }));
    const minmax = calculateMinMax(data);
    return data.map(function(d) {
        return {
            "tweet": normalizeWordVector(d.tweet, words),
            "num_likes": normalizeValue(d.num_likes, minmax.numlikes);
        };
    });
}```

In the example above `bagofwords` is a function that takes a string and buckets the words into categories.

`calculateMinMax` finds the ranges of values and then the `normalizeWordVector` and `normalizeValue` functions convert everything to the same range, in a format Neural Networks can read.


### Networks

Networks are Neural Networks, they're plug-and-play.

```function SimpleNeuralNetwork() {
    return new brain.NeuralNetwork({
        hiddenLayers: [10, 5],
        activation: 'sigmoid',
    });
}```

This function creates a new neural network with two hidden layers: one with 10 inputs and one with 5. Then the activation function it uses is `sigmoid`. It's ok if you don't fully understand this right now, you can still experiment with the 3 other plugin types and use one of the default Neural Networks.

## TAGLINES
- Neural Network Radio Stations
- Intelligence For Your Life
- Intelligent Neural Networks For your Life
- AI-powered information channels, be your own DJ
- Intelligent Information Channels
- AI-powered information channels

## URL STRUCTURE

https://neural.fm

https://neural.fm/bitcoin

https://neural.fm/music

https://neural.fm/synfonaut@moneybutton.com

## TODO

- [ ] add classifcation to CORE...think about fingerprint,output ...who did it? when? hash of that on chain
- [ ] add network plugin with ability to customize neural network architecture
- [ ] what default plugins need to be added?
    - [ ] scrapers: twitter, twetch, open directory, bit.sv
    - [ ] extractors: twitter, twetch, open directory, bit.sv
    - [ ] normalizer: default normalizer
    - [ ] network: default neural network that is easily mutatable so can be controlled with ui (and provide UI updates)

- [ ] pretty quickly implement a second data source so you can start testing multi data normalization
- [ ] see how far you can go back in twitter history
- [ ] discover limits of Twitter API
- [ ] snapshot data onchain at specific points and use the txid as an anchor/fingerprint/uuid
- [ ] think about how to do permissions....signing content?

