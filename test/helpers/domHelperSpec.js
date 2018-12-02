/*global it describe beforeEach*/
import { assert } from 'chai';
import DomHelper from '../../helpers/domHelper';

describe('getCategoryName', () => {
  let domHelper;
  beforeEach(() => {
    domHelper = DomHelper.DomHelper(
      () => {
        return {
          first: () => {
            return {
              text: () => {
              }
            };
          }
        };
      });
  });

  it('should return "Unknown" if category cannot be parsed', () => {
    // setup
    // action
    const actual = domHelper.getCategoryName(null);
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
    const actual = domHelper.getCategoryName(statsCategories, 'foo');
    // assert
    assert.equal(actual, 'Category name');
  });

  it('should throw an error if target profile was not found', () => {
    // setup

    // action
    try {
      DomHelper.DomHelper(() => {
        return {
          first: () => {
            return {
              text: () => 'Profile Not Found'
            };
          }
        };
      });
      assert.fail('Init-ing DomHelper w/ unattainable profile should throw a specific error');
    } catch (err) {
      // assert
      assert.strictEqual(err.message, 'Target profile not found. It either does not exist at all or is private.');
    }
  });
});