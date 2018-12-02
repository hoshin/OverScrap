const _ = require('lodash');

class DomHelper {
  constructor(domRef) {
    this.$ = domRef;
  }

  getHeroListForPlayerAndGameMode(gameMode) {
    return this.$(`div#${gameMode} section div div [data-js="career-select"][data-group-id="stats"]`)[0].children;
  }

  getStatsContainerForHeroAndGameMode(hero, gameMode) {
    return this.$(`div#${gameMode} section div [data-group-id="stats"][data-category-id="${hero.id}"] div div.card-stat-block table.DataTable`).toArray();
  }

  getProfileSR() {
    const currentSR = this.$('div.competitive-rank div').first().text();
    return currentSR;
  }

  extractStatName(categoryStatTitleChildren) {
    return _.get(categoryStatTitleChildren.filter(child => {
      return child.attribs.class === 'stat-title';
    }), '[0].children[0].data');
  }

  getStatTitleTopElement(statsCategories, statKey) {
    return _.get(statsCategories, `[${statKey}].children[0].children[0].children[0].children`);
  }

  getCategoryName(statsCategories, statKey) {
    const categoryStatTitleChildren = this.getStatTitleTopElement(statsCategories, statKey);
    if (!categoryStatTitleChildren) {
      return 'Unknown';
    }

    return this.extractStatName(categoryStatTitleChildren);
  }

  getStatsInCategoryForHero(statsCategories, statKey) {
    return _.get(statsCategories, `[${statKey}].children[1].children`, []);
  }

  getStatName(statCategory) {
    return statCategory.children[0].children[0].data;
  }

  getStatValue(statCategory) {
    return statCategory.children[1].children[0].data;
  }
}

module.exports.DomHelper = $ => {
  return new DomHelper($);
};