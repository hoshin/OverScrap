import cheerio from 'cheerio'
import Promise from 'bluebird'
import request from 'request-promise'
import _ from 'lodash'


class OverScrap {
  getCategoryName (statsCategories, sectionKey) {
    const categoryStatTitleChildren = _.get(statsCategories, `[${sectionKey}].children[0].children[0].children[0].children`)
    if (!categoryStatTitleChildren) {
      return 'Unknown'
    }
    return _.get(categoryStatTitleChildren.filter(child => {
      return child.name === 'span' && child.attribs.class === 'stat-title'
    }), '[0].children[0].data')
  }

  computeStatsByHero (hero, statsCategories) {
    if (!statsCategories.length || !hero.name) {
      return null
    }
    return {
      name: hero.name,
      stats: statsCategories
      .reduce((statsCategoryByHero, stat, sectionKey) => {
        statsCategoryByHero[this.getCategoryName(statsCategories, sectionKey)] =
            _.get(statsCategories, `[${sectionKey}].children[1].children`, [])
            .reduce((singleStatsByHero, statCategory) => {
              singleStatsByHero[statCategory.children[0].children[0].data] = statCategory.children[1].children[0].data
              return singleStatsByHero
            }, {})
        return statsCategoryByHero
      }, {})
    }
  }

  getHeroListForGameMode ($, gameMode) {
    return new Promise((resolve, reject) => {
      try {
        const heroList = $(`div#${gameMode} section div [data-js="career-select"][data-group-id="stats"]`)[0].children
        .map(option => ({
          id: option.attribs.value,
          name: option.attribs['option-id']
        }))
        resolve(heroList)
      } catch (err) {
        reject(new Error('No hero list found for specified game mode'))
      }
    })
  }

  // no specific error handling if computeStatsByHero fails, as it'd mean
  // that the hero listing is not consistent w/ the available data
  getHeroStatsForGameMode (heroes, $, gameMode) {
    return Promise.map(heroes, hero => {
      return this.computeStatsByHero(hero, $(`div#${gameMode} section div [data-group-id="stats"][data-category-id="${hero.id}"] div div.card-stat-block table.data-table`).toArray())
    })
    .then(data => {
      return data.reduce((acc, hero) => {
        acc[hero.name] = hero.stats
        return acc
      }, {})
    })
  }

  loadDataFromProfile (tag, region, mode) {
    const tagSplit = tag.split('#')
    if (tagSplit.length < 2) {
      return Promise.reject(new Error('Invalid tag'))
    }
    return request.get({
      uri: `https://playoverwatch.com/en-us/career/pc/${region}/${tagSplit[0]}-${tagSplit[1]}`
    })
    .then(dom => {
      const $ = cheerio.load(dom)
      return this.getHeroListForGameMode($, mode)
      .then(heroesList => this.getHeroStatsForGameMode(heroesList, $, mode))
    })
  }
}


module.exports = OverScrap