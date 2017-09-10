/*global it describe*/
import { assert } from 'chai';
import converter from '../../graph/gqlConverter';

describe('GraphQL converter', () => {
  describe('selectHeroStats', () => {
    const allHeroesStats = {
      'All Heroes': { data: 'all' },
      'foo': { data: 'foo' },
      'bar': { data: 'bar' }
    };

    it('should select stats for hero `foo` if `foo` is the hero that is asked for and return a single element', () => {
      // Given a hero (`foo`) which is in the heroesStats object
      const heroName = 'foo';
      // When we get the stats for that existing hero
      const actual = converter.selectHeroStats(allHeroesStats, heroName);
      // Then we should have a single value returned, containing all the stats
      assert.deepEqual(actual, { data: 'foo' });
    });

    it('should return null if the hero looked up does not exist in the base data', () => {
      // Given a hero (`baz`) which is _not_ in the heroesStats object
      const heroName = 'baz';
      // When we get the stats for that existing hero
      const actual = converter.selectHeroStats(allHeroesStats, heroName);
      // Then we should have a single value returned, containing all the stats
      assert.deepEqual(actual, null);
    });
  });

  describe('compressHeroDataKeys', () => {
    it('should compress first level keys of the object it is given', () => {
      // Given an object using "plain text" keys
      const singleHeroData = {
        'This is a first key': 24,
        'This-is-a-key-with-dashes': 42,
        '  this has leading and trailing spaces  ': true,
        'WEIrdCasing IS still rESpected': false
      };
      // When using the compression function on it
      const actual = converter.compressHeroDataKeys(singleHeroData);

      // Then we should replace the keys of that object by their camelCased versions
      assert.deepEqual(actual, {
          'thisIsAFirstKey': 24,
          'thisIsAKeyWithDashes': 42,
          'thisHasLeadingAndTrailingSpaces': true,
          'weIrdCasingIsStillRESpected': false
        }
      );
    });

    it('should also compress second level keys of the object it is given', () => {
      // Given an object using "plain text" keys
      const singleHeroData = {
        foo: {
          'This is a first key': 24,
          'This-is-a-key-with-dashes': 42,
          '  this has leading and trailing spaces  ': true,
          'WEIrdCasing IS still rESpected': false
        }
      };
      // When using the compression function on it
      const actual = converter.compressHeroDataKeys(singleHeroData);

      // Then we should replace the keys of that object by their camelCased versions
      assert.deepEqual(actual.foo, {
          'thisIsAFirstKey': 24,
          'thisIsAKeyWithDashes': 42,
          'thisHasLeadingAndTrailingSpaces': true,
          'weIrdCasingIsStillRESpected': false
        }
      );
    });

    it('should not delete keys if compressed & actual key are the same', () => {
      // Given an object using "plain text" keys
      const singleHeroData = { 'key': 24 };
      // When using the compression function on it
      const actual = converter.compressHeroDataKeys(singleHeroData);

      // Then we should replace the keys of that object by their camelCased versions
      assert.deepEqual(actual, { 'key': 24 }
      );
    });
  });
});