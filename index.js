import cheerio from 'cheerio';
import Promise from 'bluebird';
import request from 'request-promise';
import _ from 'lodash';

const DEFAULT_REGION = 'eu';
const DEFAULT_GAME_MODE = 'competitive';

class OverScrap {
  getCategoryName(statsCategories, statKey) {
    const getStatTitleTopElement = () => {
      return _.get(statsCategories, `[${statKey}].children[0].children[0].children[0].children`);
    };
    const extractStatName = () => {
      return _.get(categoryStatTitleChildren.filter(child => {
        return child.name === 'span' && child.attribs.class === 'stat-title';
      }), '[0].children[0].data');
    };

    const categoryStatTitleChildren = getStatTitleTopElement();
    if (!categoryStatTitleChildren) {
      return 'Unknown';
    }

    return extractStatName();
  }

  computeStatsByHero(hero, statsCategories) {
    const getStatsInCategoryForHero = statKey => {
      return _.get(statsCategories, `[${statKey}].children[1].children`, []);
    };
    const getStatName = statCategory => {
      return statCategory.children[0].children[0].data;
    };
    const getStatValue = statCategory => {
      return statCategory.children[1].children[0].data;
    };

    if (!statsCategories.length || !hero.name) {
      return null;
    }

    return {
      name: hero.name,
      stats: statsCategories
        .reduce((statsCategoryByHero, stat, statKey) => {
          statsCategoryByHero[this.getCategoryName(statsCategories, statKey)] =
            getStatsInCategoryForHero(statKey)
              .reduce((singleStatsByHero, statCategory) => {
                singleStatsByHero[getStatName(statCategory)] = getStatValue(statCategory);
                return singleStatsByHero;
              }, {});
          return statsCategoryByHero;
        }, {})
    };
  }

  getHeroListForGameMode($, gameMode) {
    const getHeroListForPlayerAndGameMode = () => {
      return $(`div#${gameMode} section div div [data-js="career-select"][data-group-id="stats"]`)[0].children;
    };
    return new Promise((resolve, reject) => {
      try {
        const heroList = getHeroListForPlayerAndGameMode()
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
  getHeroStatsForGameMode(heroes, $, gameMode) {
    const getStatsContainerForHeroAndGameMode = hero => {
      return $(`div#${gameMode} section div [data-group-id="stats"][data-category-id="${hero.id}"] div div.card-stat-block table.data-table`).toArray();
    };

    return Promise.map(heroes, hero => {
      return this.computeStatsByHero(hero, getStatsContainerForHeroAndGameMode(hero));
    })
      .then(data => {
        return data.reduce((acc, hero) => {
          acc[hero.name] = hero.stats;
          return acc;
        }, {});
      });
  }

  appendProfileData($, heroesStats) {
    const currentSR = $('div.competitive-rank div').first().text();
    return new Promise(resolve => {
      resolve({
        profile: { currentSR },
        heroesStats
      });
    });
  }

  loadRawFromProfile(tag, region, gameMode) {
    const tagSplit = tag.split('#');
    if (tagSplit.length < 2) {
      return Promise.reject(new Error('Invalid tag'));
    }
    return request.get({
      uri: `https://playoverwatch.com/en-us/career/pc/${region || DEFAULT_REGION}/${tagSplit[0]}-${tagSplit[1]}`
    })
      .then(dom => {
        const actualGameMode = gameMode || DEFAULT_GAME_MODE;
        const $ = cheerio.load(dom);
        return this.getHeroListForGameMode($, actualGameMode)
          .then(heroesList => this.getHeroStatsForGameMode(heroesList, $, actualGameMode))
          .then(heroesStats => this.appendProfileData($, heroesStats));
      });
  }

  loadDataFromProfile(tag, region, gameMode) {
    return this.loadRawFromProfile(tag, region, gameMode)
      .then(rawData => {
          _.forEach( rawData.heroesStats, heroStats => {
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
              })
            });
          });
        return rawData;
      });
  }
}

module.exports = OverScrap;
