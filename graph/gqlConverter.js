const _ = require('lodash');

const REFERENCE_KEYS_FOR_MISC_CATEGORY = [
  'multikillBest',
  'gamesTied',
  'timeSpentOnFireMostInGame',
  'offensiveAssistsAvgPer10Min',
  'damageBlockedAvgPer10Min',
  'timeSpentOnFireAvgPer10Min',
  'soloKillsAvgPer10Min',
  'objectiveTimeAvgPer10Min',
  'objectiveKillsAvgPer10Min',
  'finalBlowsAvgPer10Min',
  'eliminationsAvgPer10Min',
  'deathsAvgPer10Min',
  'gamesLost',
];

class GqlConverter {
  moveHeroSpecificDataFromMiscToHeroSpecific(rawHeroStats) {
    _.forEach(rawHeroStats.Miscelaneous, (miscStat, key) => {
      if (REFERENCE_KEYS_FOR_MISC_CATEGORY.indexOf(key) < 0) {
        if (!rawHeroStats.HeroSpecific.misc) {
          rawHeroStats.HeroSpecific.misc = {};
        }
        rawHeroStats.HeroSpecific.misc[key] = miscStat;
        delete rawHeroStats.Miscelaneous[key];
      }
    });
  }

  compressHeroDataKeys(stats) {
    _.forEach(stats, (value, key) => {
      const compressedKey = _.camelCase(key);
      stats[compressedKey] = value;
      if (compressedKey !== key) {
        delete stats[key];
      }
      if(typeof value === 'object'){
        this.compressHeroDataKeys(value);
      }
    });
    return stats;
  }

  selectHeroStats(allHeroesStats, heroName) {
    return _.find(allHeroesStats, (value, key) => {
      return key === heroName;
    }) || null;
  }
}

module.exports = new GqlConverter();