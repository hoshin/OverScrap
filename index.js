const cheerio = require('cheerio');
const Promise = require('bluebird');
const request = require('request-promise');
const _ = require('lodash');

const DEFAULT_REGION = 'eu';
const DEFAULT_GAME_MODE = 'competitive';

const OVERWATCH_URL_PREFIX = 'https://playoverwatch.com/en-us/career/pc/';

class OverScrap {
  computeStatsByHero(hero, statsCategories) {
    if (!statsCategories.length || !hero.name) {
      return null;
    }

    return {
      name: hero.name,
      stats: statsCategories
        .reduce((statsCategoryByHero, stat, statKey) => {
          statsCategoryByHero[this.domHelper.getCategoryName(statsCategories, statKey)] =
            this.domHelper.getStatsInCategoryForHero(statsCategories, statKey)
              .reduce((singleStatsByHero, statCategory) => {
                singleStatsByHero[this.domHelper.getStatName(statCategory)] = this.domHelper.getStatValue(statCategory);
                return singleStatsByHero;
              }, {});
          return statsCategoryByHero;
        }, {})
    };
  }

  getHeroListForGameMode(gameMode) {
    return new Promise((resolve, reject) => {
      try {
        const heroList = this.domHelper.getHeroListForPlayerAndGameMode(gameMode)
          .map(option => ({
            id: option.attribs.value,
            name: option.attribs['option-id']
          }));
        resolve(heroList);
      } catch (err) {
        reject(new Error('No hero list found for specified game mode'));
      }
    });
  }

  // no specific error handling if computeStatsByHero fails, as it'd mean
  // that the hero listing is not consistent w/ the available data
  getHeroStatsForGameMode(heroes, gameMode) {
    return Promise.map(heroes, hero => {
      return this.computeStatsByHero(hero, this.domHelper.getStatsContainerForHeroAndGameMode(hero, gameMode));
    })
      .then(data => {
        return data.reduce((acc, hero) => {
          acc[hero.name] = hero.stats;
          return acc;
        }, {});
      });
  }

  appendProfileData(heroesStats) {
    const currentSR = this.domHelper.getProfileSR();
    return new Promise(resolve => {
      resolve({
        profile: { currentSR },
        heroesStats
      });
    });
  }

  loadRawFromProfile(tag, region, gameMode) {
    let tagSplit;
    if(!tag || (tagSplit = tag.split('#')).length < 2){
      return Promise.reject(new Error('Invalid tag'));
    }
    return request.get({
      uri: `${OVERWATCH_URL_PREFIX}${region || DEFAULT_REGION}/${tagSplit[0]}-${tagSplit[1]}`
    })
      .then(dom => {
        const actualGameMode = gameMode || DEFAULT_GAME_MODE;
        this.domHelper = require('./helpers/domHelper').DomHelper(cheerio.load(dom));
        return this.getHeroListForGameMode(actualGameMode)
          .then(heroesList => this.getHeroStatsForGameMode(heroesList, actualGameMode))
          .then(heroesStats => this.appendProfileData(heroesStats));
      });
  }

  loadDataFromProfile(tag, region, gameMode) {
    return this.loadRawFromProfile(tag, region, gameMode)
      .then(rawData => {
        _.forEach(rawData.heroesStats, heroStats => {
          _.forEach(heroStats, statCategory => {
            _.forEach(statCategory, (statValue, key) => {
              let parsedStatValue;
              try {
                parsedStatValue = parseFloat(statValue.replace(/,/g, ''));
              } finally {
                if (parsedStatValue || parsedStatValue === 0) {
                  statCategory[key] = parsedStatValue;
                }
              }
            });
          });
        });
        return rawData;
      });
  }
}

module.exports = OverScrap;
