/*global it describe beforeEach afterEach*/
import { assert } from 'chai'
import sinon from 'sinon'
import request from 'request-promise'
import OverScrap from '../index'

describe('Overwatch stats parser', () => {
  let overScrap
  beforeEach(() => {
    overScrap = new OverScrap()
  })

  describe('loadDataFromProfile', () => {
    let getHeroListForGameModeStub
    let getHeroStatsForGameModeStub
    let getRequestStub


    beforeEach(() => {
      getHeroListForGameModeStub = sinon.stub(overScrap, 'getHeroListForGameMode')
      getHeroStatsForGameModeStub = sinon.stub(overScrap, 'getHeroStatsForGameMode')
      getRequestStub = sinon.stub(request, 'get')
    })

    afterEach(() => {
      overScrap.getHeroListForGameMode.restore()
      overScrap.getHeroStatsForGameMode.restore()
      request.get.restore()
    })

    it('should request the correct playoverwatch page', done => {
      // setup
      getRequestStub.returns(Promise.resolve({}))
      getHeroListForGameModeStub.returns(Promise.resolve([{ a: 'b' }]))
      getHeroStatsForGameModeStub.returns({})
      // action
      overScrap.loadDataFromProfile('tag#number', 'foo', 'bar')
      .then(() => {
        // assert
        sinon.assert.calledWithExactly(request.get, { uri: 'https://playoverwatch.com/en-us/career/pc/foo/tag-number' })
        assert.equal(overScrap.getHeroListForGameMode.getCall(0).args[1], 'bar')
        assert.deepEqual(overScrap.getHeroStatsForGameMode.getCall(0).args[0], [{ a: 'b' }])
        assert.equal(overScrap.getHeroStatsForGameMode.getCall(0).args[2], 'bar')
        done()
      })
      .catch(done)
    })

    it('should reject w/ an error if tag looks incomplete (no "#" separator)', done => {
      // setup

      // action
      overScrap.loadDataFromProfile('tag', 'foo', 'bar')
      .then(() => {
        done(new Error('using a wrongly formatted tag should reject'))
      })
      .catch(err => {
        // assert
        assert.equal(err.message, 'Invalid tag')
        done()
      })
      .catch(done)
    })

    it('should consider that region is `eu` if none is provided', done => {
      // setup
      getRequestStub.returns(Promise.resolve({}))
      getHeroListForGameModeStub.returns(Promise.resolve([{ a: 'b' }]))
      getHeroStatsForGameModeStub.returns({})
      // action
      overScrap.loadDataFromProfile('tag#number', null, 'bar')
      .then(() => {
        // assert
        sinon.assert.calledWithExactly(request.get, { uri: 'https://playoverwatch.com/en-us/career/pc/eu/tag-number' })
        done()
      })
      .catch(done)
    })

    it('should consider that game mode is `competitive` if none is provided', done => {
      // setup
      getRequestStub.returns(Promise.resolve({}))
      getHeroListForGameModeStub.returns(Promise.resolve([{ a: 'b' }]))
      getHeroStatsForGameModeStub.returns({})
      // action
      overScrap.loadDataFromProfile('tag#number', 'foo')
      .then(() => {
        // assert
        assert.equal(overScrap.getHeroListForGameMode.getCall(0).args[1], 'competitive')
        assert.equal(overScrap.getHeroStatsForGameMode.getCall(0).args[2], 'competitive')
        done()
      })
      .catch(done)
    })
  })

  describe('getHeroListForGameMode', () => {
    it('should reject if the hero list cannot be found', done => {
      // setup

      // action
      overScrap.getHeroListForGameMode(() => {
        null
      })
      .then(() => {
        done(new Error('we should reject if no relevant DOM to scrap was found'))
      })
      .catch(err => {
        // assert
        assert.equal(err.message, 'No hero list found for specified game mode')
        done()
      })
    })

    it('should map the ids and hero names into an array then resolve it if list exists for the mode', done => {
      // setup

      // action
      overScrap.getHeroListForGameMode(() => {
        return [{
          children: [{ attribs: { value: 'hero id 1', 'option-id': 'hero name 1' } }, {
            attribs: {
              value: 'hero id 2',
              'option-id': 'hero name 2'
            }
          }]
        }]
      })
      .then(data => {
        // assert
        assert.deepEqual(data, [{ name: 'hero name 1', id: 'hero id 1' }, { name: 'hero name 2', id: 'hero id 2' }])
        done()
      })
      .catch(done)
    })
  })

  describe('getCategoryName', () => {
    it('should return "Unknown" if category cannot be parsed', () => {
      // setup
      // action
      const actual = overScrap.getCategoryName(null)
      // assert
      assert.equal(actual, 'Unknown')
    })

    it('should return the category name if we find it in the DOM', () => {
      // setup
      const statsCategories = {
        foo: {
          children: [{
            children: [{
              children: [{
                children: [{
                  name: 'span',
                  attribs: { class: 'stat-title' },
                  children: [{ data: 'Category name' }]
                }]
              }]
            }]
          }]
        }
      }
      // action
      const actual = overScrap.getCategoryName(statsCategories, 'foo')
      // assert
      assert.equal(actual, 'Category name')
    })
  })

  describe('computeStatsByHero', () => {
    it('should return null if statsCategories array is empty', () => {
      // setup
      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [])
      // assert
      assert.equal(actual, null)
    })

    it('should return null if hero does not have a name', () => {
      // setup
      // action
      const actual = overScrap.computeStatsByHero({}, [{}])
      // assert
      assert.equal(actual, null)
    })

    it('should return hero stats data aggregated by categories if hero has a name and stats', () => {
      // setup
      sinon.stub(overScrap, 'getCategoryName').returns('CustomCategory')
      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{ children: [{}, { children: [{ children: [{ children: [{ data: 'bar' }] }, { children: [{ data: 'baz' }] }] }] }] }])
      // assert
      assert.deepEqual(actual, { name: 'foo', stats: { CustomCategory: { bar: 'baz' } } })
    })
  })

  describe('getHeroStatsForGameMode', () => {
    it('should reject if at least one hero stats computation fails', done => {
      // setup
      sinon.stub(overScrap, 'computeStatsByHero').throws(new Error('Could not parse hero data'))
      // action
      overScrap.getHeroStatsForGameMode([{}], () => {
        return {
          toArray: () => {
            return []
          }
        }
      })
      .then(() => {
        done(new Error('We should reject if there was a single error parsing the document'))
      })
      .catch(err => {
        // assert
        assert.equal(err.message, 'Could not parse hero data')
        done()
      })
    })

    it('should resolve w/ hero stats mapped by hero name', done => {
      // setup
      sinon.stub(overScrap, 'computeStatsByHero').returns({ name: 'foo', stats: { bar: 'baz' } })
      // action
      overScrap.getHeroStatsForGameMode([{}], () => {
        return {
          toArray: () => {
            return []
          }
        }
      })
      .then(data => {
        // assert
        assert.deepEqual(data, { foo: { bar: 'baz' } })
        done()
      })
      .catch(done)
    })
  })
})
