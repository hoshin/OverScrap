/*global it describe beforeEach afterEach*/
import { assert } from 'chai';
import sinon from 'sinon';
import request from 'request-promise';
import OverScrap from '../index';

describe('Overwatch stats parser', () => {
  let overScrap, domHelperStub;
  domHelperStub = {};
  beforeEach(() => {
    overScrap = new OverScrap();
    overScrap.domHelper = domHelperStub;
    domHelperStub.getProfileSR = () => '42';
  });

  describe('loadDataFromProfile', () => {
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
      return overScrap.loadDataFromProfile('tag#number', 'foo', 'bar')
        .then(() => {
          // assert
          sinon.assert.calledWithExactly(request.get, { uri: 'https://playoverwatch.com/en-us/career/pc/foo/tag-number' });
          assert.equal(overScrap.getHeroListForGameMode.calledOnce, true);
          assert.equal(overScrap.getHeroListForGameMode.getCall(0).args[0], 'bar');
          assert.deepEqual(overScrap.getHeroStatsForGameMode.getCall(0).args[0], [{ a: 'b' }]);
          assert.equal(overScrap.getHeroStatsForGameMode.getCall(0).args[1], 'bar');
        });
    });

    it('should reject w/ an "Invalid Tag" error if there is no battle tag to parse', () => {
      // setup

      // action
      return overScrap.loadDataFromProfile(undefined, 'foo', 'bar')
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
      return overScrap.loadDataFromProfile('tag', 'foo', 'bar')
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
      return overScrap.loadDataFromProfile('tag#number', null, 'bar')
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
      return overScrap.loadDataFromProfile('tag#number', 'foo')
        .then(() => {
          // assert
          assert.equal(overScrap.getHeroListForGameMode.getCall(0).args[0], 'competitive');
          assert.equal(overScrap.getHeroStatsForGameMode.getCall(0).args[1], 'competitive');
        });
    });
  });

  describe('appendProfileData', () => {

    it('should append the player\'s SR to the `profile` property if present', () => {
      // setup
      const heroesStats = {};
      domHelperStub.getProfileSR = () => 42;
      // action
      return overScrap.appendProfileData(heroesStats)
        .then(stats => {
          // assert
          assert.equal(stats.profile.currentSR, '42');
        });
    });

    it('should return an object with separated player profile & hero stats data', () => {
      // setup
      const heroesStats = { hero1: { stat: 1 }, hero2: { stat: 2 } };
      // action
      return overScrap.appendProfileData(heroesStats)
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
      domHelperStub.getHeroListForPlayerAndGameMode = () => undefined;

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
      domHelperStub.getHeroListForPlayerAndGameMode = () => [
        {
          attribs: {
            value: 'hero id 1',
            'option-id': 'hero name 1'
          }
        },
        {
          attribs: {
            value: 'hero id 2',
            'option-id': 'hero name 2'
          }
        }];

      // action
      return overScrap.getHeroListForGameMode()
        .then(data => {
          // assert
          assert.deepEqual(data, [{ name: 'hero name 1', id: 'hero id 1' }, { name: 'hero name 2', id: 'hero id 2' }]);
        });
    });
  });

  describe('computeStatsByHero', () => {
    let getCategoryNameStub;
    beforeEach(() => {
      getCategoryNameStub = sinon.stub();
      domHelperStub.getCategoryName = getCategoryNameStub;
    });

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
      domHelperStub.getCategoryName = () => 'CustomCategory';
      domHelperStub.getStatsInCategoryForHero = () => [{ bar: 'baz' }];
      domHelperStub.getStatName = () => 'bar';
      domHelperStub.getStatValue = () => 'baz';
      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{}]);
      // assert
      assert.deepEqual(actual, { name: 'foo', stats: { kdr: 0, CustomCategory: { bar: 'baz' } } });
    });

    it('should compute the a K/D ratio of 5.53 if target hero has combat stats & made 2564 elims for 463 deaths', () => {
      // setup
      domHelperStub.getStatsInCategoryForHero = () => [{ DeathsNode: 'data' }, { EliminationsNode: 'otherData' }];
      domHelperStub.getStatName = sinon.stub();
      domHelperStub.getStatValue = sinon.stub();
      domHelperStub.getCategoryName = sinon.stub().returns('Combat');

      domHelperStub.getStatName.withArgs({ DeathsNode: 'data' }).returns('Deaths');
      domHelperStub.getStatName.withArgs({ EliminationsNode: 'otherData' }).returns('Eliminations');
      domHelperStub.getStatValue.withArgs({ DeathsNode: 'data' }).returns(463);
      domHelperStub.getStatValue.withArgs({ EliminationsNode: 'otherData' }).returns(2564);

      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{}]);

      // assert
      assert.strictEqual(actual.stats.kdr, 5.53);
    });

    it('should compute the a K/D ratio of 42 if target hero has combat stats & made 42 elims for 0 deaths', () => {
      // setup
      domHelperStub.getStatsInCategoryForHero = () => [{ DeathsNode: 'data' }, { EliminationsNode: 'otherData' }];
      domHelperStub.getStatName = sinon.stub();
      domHelperStub.getStatValue = sinon.stub();
      domHelperStub.getCategoryName = sinon.stub().returns('Combat');

      domHelperStub.getStatName.withArgs({ DeathsNode: 'data' }).returns('Deaths');
      domHelperStub.getStatName.withArgs({ EliminationsNode: 'otherData' }).returns('Eliminations');
      domHelperStub.getStatValue.withArgs({ DeathsNode: 'data' }).returns(0);
      domHelperStub.getStatValue.withArgs({ EliminationsNode: 'otherData' }).returns(42);

      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{}]);

      // assert
      assert.strictEqual(actual.stats.kdr, 42);
    });

    it('should compute the a K/D ratio of 0 if target hero has combat stats & made undef elims for 42 deaths', () => {
      // setup
      domHelperStub.getStatsInCategoryForHero = () => [{ DeathsNode: 'data' }, { EliminationsNode: 'otherData' }];
      domHelperStub.getStatName = sinon.stub();
      domHelperStub.getStatValue = sinon.stub();
      domHelperStub.getCategoryName = sinon.stub().returns('Combat');

      domHelperStub.getStatName.withArgs({ DeathsNode: 'data' }).returns('Deaths');
      domHelperStub.getStatName.withArgs({ EliminationsNode: 'otherData' }).returns('Eliminations');
      domHelperStub.getStatValue.withArgs({ DeathsNode: 'data' }).returns(42);
      domHelperStub.getStatValue.withArgs({ EliminationsNode: 'otherData' });

      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{}]);

      // assert
      assert.strictEqual(actual.stats.kdr, 0);
    });

    it('should compute the a K/D ratio of 0 if target hero has no combat stats', () => {
      // setup
      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{}]);

      // assert
      assert.strictEqual(actual.stats.kdr, 0);
    });

    it('should not alter pure text data', () => {
      // setup
      domHelperStub.getStatsInCategoryForHero = () => [{ SomeTextStatNode: 'data' }];
      domHelperStub.getStatName = sinon.stub();
      domHelperStub.getStatValue = sinon.stub();
      getCategoryNameStub.returns('SomeTextStatCategory');

      domHelperStub.getStatName.withArgs({ SomeTextStatNode: 'data' }).returns('SomeTextStat');
      domHelperStub.getStatValue.withArgs({ SomeTextStatNode: 'data' }).returns('some data that cannot be converted to an int or float');

      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{}]);
      // assert
      assert.deepEqual(actual, {
        name: 'foo',
        stats: {
          SomeTextStatCategory: {
            SomeTextStat: 'some data that cannot be converted to an int or float',
          },
          kdr: 0
        }
      });
    });

    it('should parse as floats strings that are only digits', () => {
      // setup
      domHelperStub.getStatsInCategoryForHero = () => [{ SomeIntegerDataNode: 'data' }];
      domHelperStub.getStatName = sinon.stub();
      domHelperStub.getStatValue = sinon.stub();
      getCategoryNameStub.returns('SomeTextStatCategory');

      domHelperStub.getStatName.withArgs({ SomeIntegerDataNode: 'data' }).returns('SomeIntegerData');
      domHelperStub.getStatValue.withArgs({ SomeIntegerDataNode: 'data' }).returns('42100');

      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{}]);
      // assert
      assert.deepEqual(actual, {
        name: 'foo',
        stats: {
          SomeTextStatCategory: {
            SomeIntegerData: 42100,
          },
          kdr: 0
        }
      });
    });

    it('should parse as floats strings that are integers formatted the american way (with a comma)', () => {
      // setup
      domHelperStub.getStatsInCategoryForHero = () => [{ SomeIntegerDataNode: 'data' }];
      domHelperStub.getStatName = sinon.stub();
      domHelperStub.getStatValue = sinon.stub();
      getCategoryNameStub.returns('SomeTextStatCategory');

      domHelperStub.getStatName.withArgs({ SomeIntegerDataNode: 'data' }).returns('SomeIntegerData');
      domHelperStub.getStatValue.withArgs({ SomeIntegerDataNode: 'data' }).returns('42,240');

      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{}]);
      // assert
      assert.deepEqual(actual, {
        name: 'foo',
        stats: {
          SomeTextStatCategory: {
            SomeIntegerData: 42240,
          },
          kdr: 0
        }
      });
    });

    it('should set properties which value is zero as 0 instead of "0"', () => {
      // setup
      domHelperStub.getStatsInCategoryForHero = () => [{ SomeIntegerDataNode: 'data' }];
      domHelperStub.getStatName = sinon.stub();
      domHelperStub.getStatValue = sinon.stub();
      getCategoryNameStub.returns('SomeTextStatCategory');

      domHelperStub.getStatName.withArgs({ SomeIntegerDataNode: 'data' }).returns('SomeIntegerData');
      domHelperStub.getStatValue.withArgs({ SomeIntegerDataNode: 'data' }).returns('0');

      // action
      const actual = overScrap.computeStatsByHero({ name: 'foo' }, [{}]);
      // assert
      assert.deepEqual(actual, {
        name: 'foo',
        stats: {
          SomeTextStatCategory: {
            SomeIntegerData: 0,
          },
          kdr: 0
        }
      });
    });
  });

  describe('getHeroStatsForGameMode', () => {
    it('should reject if at least one hero stats computation fails', () => {
      // setup
      domHelperStub.getStatsContainerForHeroAndGameMode = () => {
      };
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
});
