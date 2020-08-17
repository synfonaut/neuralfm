

                     _   _                      _  _________  ___
                    | \ | |                    | | |  ___|  \/  |
                    |  \| | ___ _   _ _ __ __ _| | | |_  | .  . |
                    | . ` |/ _ \ | | | '__/ _` | | |  _| | |\/| |
                    | |\  |  __/ |_| | | | (_| | |_| |   | |  | |
                    \_| \_/\___|\__,_|_|  \__,_|_(_)_|   \_|  |_/
                                                                 
                              AI Information Radio


# NeuralFM

NeuralFM's mission is to put you in control of the AI's feeding you information.

Say goodbye to factory farmed algorithms from megacorps that destroy your life. NeuralFM offers a novel solution to the biggest invisible: algorithm bias.

Some Google or Facebook engineer is probably going to decide the next President of the United States. It's bad enough when megacorps purposefully bias algorithms (it really is). What's shocking though, is even with small algorithms, and even when unintended, human bias infects AI. Even worse, AI are "black boxes"—many of the creators don't fully understand what's happening inside.

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

### Feature Extractors

Feature Extractors decide which parts of the data are important.

### Normalizers

Normalizers convert those data features into a similar format.

### Networks

Networks are Neural Networks, they're plug-and-play.

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


- run calculation up to X most recent entries
- run longer full data calculations in background
- before updating predictions, reset all back to 0

## SCALING PROBLEM
- There's just too many rows...you need to classify a smaller data set while iterating and then do the full one in the background
- Clear Twitter dataset....only grab recent 50 tweets?
- Do a little more testing on what is actually slow.... mysql streaming? normalization? prediction? all of it?
- What else is causing the slow down?
- Could cache trainingInputData if that is slow...might make DB big bug oh well....
- MongoDB batch size....see if faster ways to stream data in
- btw streaming data doesn't even seem to be working...it's not calling 'done' which means promise is hanging.....
- what's a way we could hack it so that we could ship tomorrow? my vote right now? make data set smaller... goodnight. and good luck

## TODO
- [ ] Editor mode
- [ ] Classify it
- [ ] Train it


- [ ] Image mode
- [ ] Classification mode

## BONUS ROUND
- [ ] title tags
- [ ] snapshot hashes of data models on chain
- [ ] paymail integration
- [ ] tonicpow integration

## BEFORE GOING LIVE
- [ ] SSL certificate
- [ ] Error boundary
- [ ] Copywriting

## NICE TO HAVE
- [ ] Performance optimzations on normalizer...iterative so doesn't need entire data set in memory
- [ ] Performance optimzations on prediction updater....bulk writer
- [ ] Performance optimzations on model input size
- [ ] Performance optimzations on training...it takes a really long time...likely just do load soure dat
    - [ ] Is there a move to make training a lot more lightweight but only using partial data?
    - [ ] Is there a move to make training a lot more lightweight but only using partial data?
- [ ] Update all throw "strings" into throw new Error("string")...it makes stack traces nicer
- [ ] Custom Colors ...just something a little unique
- [ ] A few icons here and there would make a big different ("like on the create button")
- [ ] Loading spinner before side loads (with timout and error message)
- [ ] training with callback to provide UI updates
- [ ] cancel training in middle

- [ ] model is getting detached when server resets or client closes website....need to wake up socket automatically when client reconnects

## INSANE MODE
- [ ] implement twetch source to start testing multi data normalization
- [ ] scrape a lot of twitter history
- [ ] sometimes caldera is crashing


## AFTER
- [ ] Thorough review of data model and indexes. Don't need to index entire normalization field just to check if it exists...probably need a separate field
