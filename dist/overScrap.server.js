'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var express = require('express');
var graphqlHTTP = require('express-graphql');
var _ = require('lodash');
var Scrapper = require('../index');
var schema = require('../graph/schema');

var mockedData = require('../sampleData/example.json');

var scrapper = new Scrapper();

var REFERENCE_KEYS = ['MultikillBest', 'GamesTied', 'TimeSpentonFireMostinGame', 'OffensiveAssistsAvgper10Min', 'DamageBlockedAvgper10Min', 'TimeSpentonFireAvgper10Min', 'SoloKillsAvgper10Min', 'ObjectiveTimeAvgper10Min', 'ObjectiveKillsAvgper10Min', 'FinalBlowsAvgper10Min', 'EliminationsAvgper10Min', 'DeathsAvgper10Min', 'GamesLost'];

var OverScrapServer = function () {
  function OverScrapServer(config) {
    var _this = this;

    _classCallCheck(this, OverScrapServer);

    this.server = express();
    this.server.get('/api', function (req, res) {
      var _req$query = req.query,
          tag = _req$query.tag,
          region = _req$query.region,
          mode = _req$query.mode;

      if (!tag || !region || !mode) {
        res.status(400).json({ error: 'Invalid parameters, missing at least tag, region or mode query param' });
      }
      _this.scrap(req.query.tag, req.query.region, req.query.gameMode).then(function (data) {
        res.json(data);
      });
    });
    this.server.use('/graphql', graphqlHTTP({
      schema: schema,
      rootValue: {
        statsByHeroName: function statsByHeroName(options) {
          return _this.scrap(options.battleTag, options.region, options.mode).then(function (data) {
            var specificHeroStats = void 0;
            specificHeroStats = _.filter(data.heroesStats, function (value, key) {
              return key === options.heroName;
            });
            var rawHeroStats = specificHeroStats[0];
            _.forEach(rawHeroStats, function (value, key) {
              var compressedKey = key.replace(/[ \-]/g, '');
              rawHeroStats[compressedKey] = value;
              _.forEach(Object.keys(value), function (secondLevelKey) {
                var compressedKey = secondLevelKey.replace(/[ \-]/g, '');
                value[compressedKey] = value[secondLevelKey];
              });
            });

            _.forEach(rawHeroStats.Miscelaneous, function (miscStat, key) {
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
              Miscelaneous: rawHeroStats.Miscelaneous
            };
          });
        },
        statByName: function statByName(options) {}
      },
      graphiql: true
    }));
    this.port = config.port;
  }

  _createClass(OverScrapServer, [{
    key: 'scrap',
    value: function scrap(tag, region, mode) {
      if (process.env['OVERSCRAP_ENV'] === 'production') {
        return scrapper.loadDataFromProfile(tag, region, mode);
      } else {
        return Promise.resolve(mockedData);
      }
    }
  }, {
    key: 'start',
    value: function start() {
      var _this2 = this;

      if (!this.instance) {
        this.instance = this.server.listen(this.port, function () {
          console.log('Server running on port:' + _this2.instance.address().port);
        });
        return true;
      }
      return false;
    }
  }, {
    key: 'stop',
    value: function stop() {
      var _this3 = this;

      if (this.instance) {
        this.instance.close(function () {
          delete _this3.instance;
          console.log('Server shutdown complete');
        });
        return true;
      }
      return false;
    }
  }]);

  return OverScrapServer;
}();

var initServer = function initServer(config) {
  return new OverScrapServer(config);
};

module.exports = initServer;
