const express = require('express');
const graphqlHTTP = require('express-graphql');
const Scrapper = require('../index');
const schema = require('../graph/schema');
const converter = require('../graph/gqlConverter');

const mockedData = require('../sampleData/example.json') || {};

const scrapper = new Scrapper();

class OverScrapServer {
  constructor(config) {
    this.server = express();
    this.server.get('/api', (req, res) => {
      const { tag, region, mode } = req.query;
      if (!tag || !region || !mode) {
        res.status(400).json({ error: 'Invalid parameters, missing at least tag, region or mode query param' });
      }
      this.scrap(req.query.tag, req.query.region, req.query.gameMode).then(data => {
        res.json(data);
      });
    });
    this.server.use('/graphql', graphqlHTTP({
      schema: schema,
      rootValue: {
        statsByHeroName: (options) => {
          return this.scrap(options.battleTag, options.region, options.mode)
            .then(data => {
              const singleHeroStats = converter.selectHeroStats(data.heroesStats, options.heroName);
              const rawHeroStats = converter.compressHeroDataKeys(singleHeroStats);
              converter.moveHeroSpecificDataFromMiscToHeroSpecific(rawHeroStats);

              return {
                name: options.heroName,
                heroSpecific: { raw: rawHeroStats.heroSpecific },
                combat: rawHeroStats.combat,
                assists: rawHeroStats.assists,
                best: rawHeroStats.best,
                average: rawHeroStats.average,
                deaths: rawHeroStats.deaths ? rawHeroStats.deaths.deaths : null,
                matchAwards: rawHeroStats.matchAwards,
                game: rawHeroStats.game,
                miscellaneous: rawHeroStats.miscellaneous,
                kdr: rawHeroStats.kdr,
                raw:data,
              };
            });
        },
      },
      graphiql: true,
    }));
    this.port = config.port;
  }

  scrap(tag, region, mode) {
    if (process.env['OVERSCRAP_ENV'] === 'production') {
      return scrapper.loadDataFromProfile(tag, region, mode);
    } else {
      return Promise.resolve(mockedData);
    }
  }

  start() {
    if (!this.instance) {
      this.instance = this.server.listen(this.port, () => {
        console.log(`Server running on port:${this.instance.address().port}`); // eslint-disable-line
      });
      return true;
    }
    return false;
  }

  stop() {
    if (this.instance) {
      this.instance.close(() => {
        delete this.instance;
        console.log('Server shutdown complete'); // eslint-disable-line
      });
      return true;
    }
    return false;
  }
}

const initServer = config => {
  return new OverScrapServer(config);
};

module.exports = initServer;
