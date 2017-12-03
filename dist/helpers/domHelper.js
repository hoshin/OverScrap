'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');

var DomHelper = function () {
  function DomHelper(domRef) {
    _classCallCheck(this, DomHelper);

    this.$ = domRef;
  }

  _createClass(DomHelper, [{
    key: 'getHeroListForPlayerAndGameMode',
    value: function getHeroListForPlayerAndGameMode(gameMode) {
      return this.$('div#' + gameMode + ' section div div [data-js="career-select"][data-group-id="stats"]')[0].children;
    }
  }, {
    key: 'getStatsContainerForHeroAndGameMode',
    value: function getStatsContainerForHeroAndGameMode(hero, gameMode) {
      return this.$('div#' + gameMode + ' section div [data-group-id="stats"][data-category-id="' + hero.id + '"] div div.card-stat-block table.data-table').toArray();
    }
  }, {
    key: 'getProfileSR',
    value: function getProfileSR() {
      var currentSR = this.$('div.competitive-rank div').first().text();
      return currentSR;
    }
  }, {
    key: 'extractStatName',
    value: function extractStatName(categoryStatTitleChildren) {
      return _.get(categoryStatTitleChildren.filter(function (child) {
        return child.attribs.class === 'stat-title';
      }), '[0].children[0].data');
    }
  }, {
    key: 'getStatTitleTopElement',
    value: function getStatTitleTopElement(statsCategories, statKey) {
      return _.get(statsCategories, '[' + statKey + '].children[0].children[0].children[0].children');
    }
  }, {
    key: 'getCategoryName',
    value: function getCategoryName(statsCategories, statKey) {
      var categoryStatTitleChildren = this.getStatTitleTopElement(statsCategories, statKey);
      if (!categoryStatTitleChildren) {
        return 'Unknown';
      }

      return this.extractStatName(categoryStatTitleChildren);
    }
  }, {
    key: 'getStatsInCategoryForHero',
    value: function getStatsInCategoryForHero(statsCategories, statKey) {
      return _.get(statsCategories, '[' + statKey + '].children[1].children', []);
    }
  }, {
    key: 'getStatName',
    value: function getStatName(statCategory) {
      return statCategory.children[0].children[0].data;
    }
  }, {
    key: 'getStatValue',
    value: function getStatValue(statCategory) {
      return statCategory.children[1].children[0].data;
    }
  }]);

  return DomHelper;
}();

module.exports.DomHelper = function ($) {
  return new DomHelper($);
};
