const express = require('express');
const graphqlHTTP = require('express-graphql');
const _ = require('lodash');
const Scrapper = require('../index');
const schema = require('../graph/schema');

const mockedData = require('../example.json');

const scrapper = new Scrapper();

const REFERENCE_KEYS = [
  'MultikillBest',
  'GamesTied',
  'TimeSpentonFireMostinGame',
  'OffensiveAssistsAvgper10Min',
  'DamageBlockedAvgper10Min',
  'TimeSpentonFireAvgper10Min',
  'SoloKillsAvgper10Min',
  'ObjectiveTimeAvgper10Min',
  'ObjectiveKillsAvgper10Min',
  'FinalBlowsAvgper10Min',
  'EliminationsAvgper10Min',
  'DeathsAvgper10Min',
  'GamesLost',
];

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
              let specificHeroStats;
              specificHeroStats = _.filter(data.heroesStats, (value, key) => {
                return key === options.heroName;
              });
              let rawHeroStats = specificHeroStats[0];
              _.forEach(rawHeroStats, (value, key) => {
                const compressedKey = key.replace(/[ \-]/g, '');
                rawHeroStats[compressedKey] = value;
                _.forEach(Object.keys(value), secondLevelKey => {
                  const compressedKey = secondLevelKey.replace(/[ \-]/g, '');
                  value[compressedKey] = value[secondLevelKey];
                });
              });

              _.forEach(rawHeroStats.Miscelaneous, (miscStat, key) => {
                if (REFERENCE_KEYS.indexOf(key) < 0) {
                  if (!rawHeroStats.HeroSpecific.misc) {
                    rawHeroStats.HeroSpecific.misc = {};
                  }
                  rawHeroStats.HeroSpecific.misc[key] = miscStat;
                  delete rawHeroStats.Miscelaneous[key];
                }
              });

              return {
                name: options.heroName,
                HeroSpecific: { raw: rawHeroStats.HeroSpecific },
                Combat: rawHeroStats.Combat,
                Assists: rawHeroStats.Assists,
                Best: rawHeroStats.Best,
                Average: rawHeroStats.Average,
                Deaths: rawHeroStats.Deaths.Deaths,
                MatchAwards: rawHeroStats.MatchAwards,
                Game: rawHeroStats.Game,
                Miscelaneous: rawHeroStats.Miscelaneous,
              };
            });
        },
        statByName: (options) => {
        }
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
        console.log(`Server running on port:${this.instance.address().port}`);
      });
      return true;
    }
    return false;
  }

  stop() {
    if (this.instance) {
      this.instance.close(() => {
        delete this.instance;
        console.log('Server shutdown complete');
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