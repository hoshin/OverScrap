/*global it describe beforeEach*/
import { assert } from 'chai';
import DomHelper from '../../helpers/domHelper';

describe('getCategoryName', () => {
  let domHelper;
  beforeEach(() => {
    domHelper = DomHelper.DomHelper({});
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
});