/*global it describe beforeEach afterEach*/
import { assert } from 'chai';
import sinon from 'sinon';
import request from 'request-promise';
import OverScrap from '../index';

describe('Overwatch stats parser', () => {
  let overScrap;
  beforeEach(() => {
    overScrap = new OverScrap();
  });

  describe('loadRawFromProfile', () => {
    let getHeroListForGameModeStub;
    let getHeroStatsForGameModeStub;
    let getRequestStub;

    beforeEach(() => {
      getHeroListForGameModeStub = sinon.stub(overScrap, 'getHeroListForGameMode');
      getHeroStatsForGameModeStub = sinon.stub(overScrap, 'getHeroStatsForGameMode');
      getRequestStub = sinon.stub(request, 'get');
    });

    afterEach(() => {
      overScrap.getHeroListForGameMode.restore();
      overScrap.getHeroStatsForGameMode.restore();
      request.get.restore();
    });

    it('should request the correct playoverwatch page', () => {
      // setup
      getRequestStub.returns(Promise.resolve({}));
      getHeroListForGameModeStub.returns(Promise.resolve([{ a: 'b' }]));
      getHeroStatsForGameModeStub.returns({});
      // action
      return overScrap.loadRawFromProfile('tag#number', 'foo', 'bar')
        .then(() => {
          // assert
          sinon.assert.calledWithExactly(request.get, { uri: 'https://playoverwatch.com/en-us/career/pc/foo/tag-number' });
          assert.equal(overScrap.getHeroListForGameMode.getCall(0).args[1], 'bar');
          assert.deepEqual(overScrap.getHeroStatsForGameMode.getCall(0).args[0], [{ a: 'b' }]);
          assert.equal(overScrap.getHeroStatsForGameMode.getCall(0).args[2], 'bar');
        });
    });

    it('should reject w/ an "Invalid Tag" error if there is no battle tag to parse', () => {
      // setup

      // action
      return overScrap.loadRawFromProfile(undefined, 'foo', 'bar')
        .then(() => {
          assert.fail('using a wrongly formatted tag should reject');
        })
        .catch(err => {
          // assert
          assert.equal(err.message, 'Invalid tag');
        });
    });

    it('should reject w/ an error if tag looks incomplete (no "#" separator)', () => {
      // setup

      // action
      return overScrap.loadRawFromProfile('tag', 'foo', 'bar')
        .then(() => {
          assert.fail('using a wrongly formatted tag should reject');
        })
        .catch(err => {
          // assert
          assert.equal(err.message, 'Invalid tag');
        });
    });

    it('should consider that region is `eu` if none is provided', () => {
      // setup
      getRequestStub.returns(Promise.resolve({}));
      getHeroListForGameModeStub.returns(Promise.resolve([{ a: 'b' }]));
      getHeroStatsForGameModeStub.returns({});
      // action
      return overScrap.loadRawFromProfile('tag#number', null, 'bar')
        .then(() => {
          // assert
          sinon.assert.calledWithExactly(request.get, { uri: 'https://playoverwatch.com/en-us/career/pc/eu/tag-number' });
        });
    });

    it('should consider that game mode is `competitive` if none is provided', () => {
      // setup
      getRequestStub.returns(Promise.resolve({}));
      getHeroListForGameModeStub.returns(Promise.resolve([{ a: 'b' }]));
      getHeroStatsForGameModeStub.returns({});
      // action
      return overScrap.loadRawFromProfile('tag#number', 'foo')
        .then(() => {
          // assert
          assert.equal(overScrap.getHeroListForGameMode.getCall(0).args[1], 'competitive');
          assert.equal(overScrap.getHeroStatsForGameMode.getCall(0).args[2], 'competitive');
        });
    });
  });

  describe('appendProfileData', () => {
    it('should append the player\'s SR to the `profile` property if present', () => {
      // setup
      const heroesStats = {};
      const domLookup = sinon.stub().returns({ first: sinon.stub().returns({ text: sinon.stub().returns('42') }) });
      // action
      return overScrap.appendProfileData(domLookup, heroesStats)
        .then(stats => {
          // assert
          assert.equal(domLookup.calledOnce, true);
          sinon.assert.calledWithExactly(domLookup, 'div.competitive-rank div');
          assert.equal(stats.profile.currentSR, '42');
        });
    });

    it('should return an object with separated player profile & hero stats data', () => {
      // setup
      const heroesStats = { hero1: { stat: 1 }, hero2: { stat: 2 } };
      const domLookup = sinon.stub().returns({ first: sinon.stub().returns({ text: sinon.stub().returns('42') }) });
      // action
      return overScrap.appendProfileData(domLookup, heroesStats)
        .then(dataToReturn => {
          // assert
          assert.deepEqual(dataToReturn, {
            profile: { currentSR: '42' },
            heroesStats: { hero1: { stat: 1 }, hero2: { stat: 2 } }
          });
        });
    });
  });

  describe('getHeroListForGameMode', () => {
    it('should reject if the hero list cannot be found', () => {
      // setup

      // action
      return overScrap.getHeroListForGameMode(() => {
        null;
      })
        .then(() => {
          assert.fail('we should reject if no relevant DOM to scrap was found');
        })
        .catch(err => {
          // assert
          assert.equal(err.message, 'No hero list found for specified game mode');
        });
    });

    it('should map the ids and hero names into an array then resolve it if list exists for the mode', () => {
      // setup

      // action
      return overScrap.getHeroListForGameMode(() => {
        return [{
          children: [{ attribs: { value: 'hero id 1', 'option-id': 'hero name 1' } }, {
            attribs: {
              value: 'hero id 2',
              'option-id': 'hero name 2'
            }
          }]
        }];
      })
        .then(data => {
          // assert
          assert.deepEqual(data, [{ name: 'hero name 1', id: 'hero id 1' }, { name: 'hero name 2', id: 'hero id 2' }]);
        });
    });
  });

  describe('getCategoryName', () => {
    it('should return "Unknown" if category cannot be parsed', () => {
      // setup
      // action
      const actual = overScrap.getCategoryName(null);
      // assert
      assert.equal(actual, 'Unknown');
    });

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
      };
      // action
      const actual = overScrap.getCategoryName(statsCategories, 'foo');
      // assert
      assert.equal(actual, 'Category name');
    });
  });

  describe('computeStatsByHero', () => {
    it('should return null if statsCategories array is empty', () => {
      // setup
      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, []);
      // assert
      assert.equal(actual, null);
    });

    it('should return null if hero does not have a name', () => {
      // setup
      // action
      const actual = overScrap.computeStatsByHero({}, [{}]);
      // assert
      assert.equal(actual, null);
    });

    it('should return hero stats data aggregated by categories if hero has a name and stats', () => {
      // setup
      sinon.stub(overScrap, 'getCategoryName').returns('CustomCategory');
      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{ children: [{}, { children: [{ children: [{ children: [{ data: 'bar' }] }, { children: [{ data: 'baz' }] }] }] }] }]);
      // assert
      assert.deepEqual(actual, { name: 'foo', stats: { CustomCategory: { bar: 'baz' } } });
    });
  });

  describe('getHeroStatsForGameMode', () => {
    it('should reject if at least one hero stats computation fails', () => {
      // setup
      sinon.stub(overScrap, 'computeStatsByHero').throws(new Error('Could not parse hero data'));
      // action
      return overScrap.getHeroStatsForGameMode([{}], () => {
        return {
          toArray: () => {
            return [];
          }
        };
      })
        .then(() => {
          assert.fail('We should reject if there was a single error parsing the document');
        })
        .catch(err => {
          // assert
          assert.equal(err.message, 'Could not parse hero data');
        });
    });

    it('should resolve w/ hero stats mapped by hero name', () => {
      // setup
      sinon.stub(overScrap, 'computeStatsByHero').returns({ name: 'foo', stats: { bar: 'baz' } });
      // action
      return overScrap.getHeroStatsForGameMode([{}], () => {
        return {
          toArray: () => {
            return [];
          }
        };
      })
        .then(data => {
          // assert
          assert.deepEqual(data, { foo: { bar: 'baz' } });
        });
    });
  });

  describe('loadDataFromProfile', () => {
    let loadRawFromProfileStub;
    beforeEach(() => {
      loadRawFromProfileStub = sinon.stub(overScrap, 'loadRawFromProfile');
    });
    it('should not alter pure text data', () => {
      // setup
      loadRawFromProfileStub.resolves({
        heroesStats: {
          'ALL HEROES': {
            StatCategory: {
              SomeTextStat: 'some data that cannot be converted to an int or float'
            }
          }
        }
      });
      // action
      return overScrap.loadDataFromProfile('tag', 'region', 'gameMode')
        .then(loadedData => {
          // assert
          assert.deepEqual(loadedData, {
            heroesStats: {
              'ALL HEROES': {
                StatCategory: {
                  SomeTextStat: 'some data that cannot be converted to an int or float'
                }
              }
            }
          });
        });
    });

    it('should parse as floats strings that are only digits', () => {
      // setup
      loadRawFromProfileStub.resolves({
        heroesStats: {
          'ALL HEROES': {
            StatCategory: {
              SomeIntegerData: '42.24'
            }
          }
        }
      });
      // action
      return overScrap.loadDataFromProfile(null, null, null)
        .then(loadedData => {
          // assert
          assert.deepEqual(loadedData, {
            heroesStats: {
              'ALL HEROES': {
                StatCategory: {
                  SomeIntegerData: 42.24
                }
              }
            }
          });
        });
    });

    it('should parse as floats strings that are integers formatted the american way (with a comma)', () => {
      // setup
      loadRawFromProfileStub.resolves({
        heroesStats: {
          'ALL HEROES': {
            StatCategory: {
              SomeIntegerData: '42,100'
            }
          }
        }
      });
      // action
      return overScrap.loadDataFromProfile(null, null, null)
        .then(loadedData => {
          // assert
          assert.deepEqual(loadedData, {
            heroesStats: {
              'ALL HEROES': {
                StatCategory: {
                  SomeIntegerData: 42100
                }
              }
            }
          });
        });
    });

    it('should set properties which value is zero as 0 instead of "0"', () => {
      // setup
      loadRawFromProfileStub.resolves({
        heroesStats: {
          'ALL HEROES': {
            StatCategory: {
              SomeIntegerData: '0'
            }
          }
        }
      });
      // action
      return overScrap.loadDataFromProfile(null, null, null)
        .then(loadedData => {
          // assert
          assert.deepEqual(loadedData, {
            heroesStats: {
              'ALL HEROES': {
                StatCategory: {
                  SomeIntegerData: 0
                }
              }
            }
          });
        });
    });
  });
});
