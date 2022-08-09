import { h } from '../src/helpers.js';
import { defChannels } from '../src/def-channels.js';
import { defOptions } from '../src/def-options';


// ========== iterables ==========

test('some, 1', () => { 
  expect(h.some([0, 5, null], v => v)).toBe(true)
});
test('some, 2', () => { 
  expect(h.some([2, 5, 7], v => v === 5)).toBe(true)
});
test('some, 3', () => { 
  const arr = [10, 20, 30];
  expect(h.some(arr, (v, i, a) => v === 20 && i === 1 && a === arr))
    .toBe(true)
});
test('some, 4', () => { 
  expect(h.some(new Set([false, true]), v => v)).toBe(true)
});
test('some, 5', () => { 
  expect(h.some([undefined, false], v => v)).toBe(false)
});
test('some, 6', () => { 
  expect(h.some([], v => v)).toBe(false)
});

test('every, 1', () => { 
  expect(h.every([2, 5, {}], v => v)).toBe(true)
});
test('every, 2', () => { 
  expect(h.every([2, 5, 0], v => typeof v === 'number')).toBe(true)
});
test('every, 3', () => { 
  const arr = [0, 1, 2];
  expect(h.every(arr, (v, i, a) => v === i && a === arr)).toBe(true)
});
test('every, 4', () => { 
  expect(h.every(new Set([false, true]), v => v)).toBe(false)
});
test('every, 5', () => { 
  expect(h.every([undefined, false], v => v)).toBe(false)
});
test('every, 6', () => { 
  expect(h.every([], v => v)).toBe(true)
});

test('pick, 1', () => { 
  expect(h.pick([{a: 5, b: 6}, {a:7, b: 8}], 'a'))
    .toStrictEqual([5, 7])
});
test('pick, 2', () => { 
  expect(h.pick(new Set([[5, 6], [7, 8]]), 1))
    .toStrictEqual([6, 8])
});

test('markChannelError, 1', () => { 
  expect(() => h.markChannelError('point', 'fill', 'some message'))
    .toThrow('mark-point, channel-fill, some message')
});


// ========== other ==========

test('isNullish, 1', () => { 
  expect(h.isNullish(null)).toBe(true)
});
test('isNullish, 2', () => { 
  expect(h.isNullish(0)).toBe(false)
});

test('getKind, 1', () => { 
  expect(h.getKind('stroke')).toBe('common')
});

test('isInfOrNaN, 1', () => { 
  expect(h.isInfOrNaN(Infinity)).toBe(true)
});
test('isInfOrNaN, 2', () => { 
  expect(h.isInfOrNaN(NaN)).toBe(true)
});
test('isInfOrNaN, 3', () => { 
  expect(h.isInfOrNaN(undefined)).toBe(false)
});

test('isArrayOfObjects, 1', () => { 
  expect(h.isArrayOfObjects([])).toBe(true)
});
test('isArrayOfObjects, 2', () => { 
  expect(h.isArrayOfObjects([{u: 5, v: 6}, [6, 7, 8]])).toBe(true)
});
test('isArrayOfObjects, 3', () => { 
  expect(h.isArrayOfObjects(5)).toBe(false)
});

test('getDataset, 1', () => { 
  expect(h.getDataset(3)).toStrictEqual([0, 1, 2])
});
test('getDataset, 2', () => { 
  expect(h.getDataset([3, 5])).toStrictEqual([3, 5])
});
test('getDataset, 3', () => { 
  expect(() => h.getDataset({u: 5, v: 6}))
    .toThrow('dataset must be an array or a positive integer')
});
test('getDataset, 4', () => { 
  expect(() => h.getDataset([]))
    .toThrow('dataset cannot be empty')
});

test('capitalize, 1', () => { 
  expect(h.capitalize('haha')).toBe('Haha')
});

test('camelToKebab, 1', () => { 
  expect(h.camelToKebab('thisIsSomeName')).toBe('this-is-some-name')
});

test('cropTilde, 1', () => { 
  expect(h.cropTilde('~someName')).toBe('someName')
});
test('cropTilde, 2', () => { 
  expect(h.cropTilde('someName')).toBe('someName')
});

test('minVal, 1', () => { 
  expect(h.minVal([3, -2, 5, null, -1])).toBe(-2)
});

test('maxVal, 1', () => { 
  expect(h.maxVal([3, -2, 5, null, -1])).toBe(5)
});

test('checkShapeScheme, 1', () => { 
  expect(h.checkShapeScheme(['plus', 'circle'], {type: 'point'}))
    .toStrictEqual(['plus', 'circle'])
});

test('checkShapeScheme, 2', () => { 
  expect(() => h.checkShapeScheme(['plus', 'abc'], {type: 'point'}))
    .toThrow('mark-point, invalid shape name')
});

test('checkData, 1', () => { 
  expect(() => h.checkData(
    [],
    {type: 'point'},
    'fill'
  )).toThrow('mark-point, channel-fill, empty data array')
});
test('checkData, 2', () => { 
  expect(() => h.checkData(
    [5, NaN, 7],
    {type: 'point'},
    'fill'
  )).toThrow('mark-point, channel-fill, non-finite data value (NaN, Infinity or -Infinity')
});
test('checkData, 3', () => { 
  expect(() => h.checkData(
    [5, 'abc', null, 20],
    {type: 'point'},
    'fill'
  )).toThrow('mark-point, channel-fill, missing data value')
});
test('checkData, 4', () => { 
  expect(() => h.checkData(
    [null, undefined],
    {type: 'point', missing: 'skip'},
    'fill'
  )).toThrow('mark-point, channel-fill, every datum has a missing value')
});
test('checkData, 5', () => { 
  expect(h.checkData(
    [5, 6, 7],
    {type: 'point'},
    'fill'
  )).toStrictEqual({data: [5, 6, 7], missingInds: undefined})
});
test('checkData, 6', () => { 
  expect(h.checkData(
    [5, null, 7],
    {type: 'point', missing: 'skip'},
    'fill'
  )).toStrictEqual({data: [5, null, 7], missingInds: new Set([1])})
});

test('getChannelDefault, 1', () => { 
  expect(h.getChannelDefault({type: 'point'}, 'fill'))
    .toStrictEqual(defChannels.get('fill').point)
});
test('getChannelDefault, 2', () => { 
  expect(h.getChannelDefault({type: 'hBar'}, 'vAlign'))
    .toStrictEqual(defChannels.get('vAlign').def)
});

test('fourOption, 1', () => { 
  const def = defOptions.legendPadding;
  expect(h.fourOption({legendPadding: [5,,,10]}, 'legendPadding'))
    .toStrictEqual([5, def, def, 10])
});
test('fourOption, 2', () => { 
  expect(h.fourOption({legendPadding: 5}, 'legendPadding'))
    .toStrictEqual([5, 5, 5, 5])
});
test('fourOption, 3', () => {
  const def = defOptions.legendPadding; 
  expect(h.fourOption({}, 'legendPadding'))
    .toStrictEqual([def, def, def, def])
});

test('populateDataMap, 1', () => {
  const dataMap = new Map();
  h.populateDataMap(dataMap, 'fill', ['red', 'blue']);
  expect(dataMap).toStrictEqual(new Map([['red', 0], ['blue', 1]]));
});
test('populateDataMap, 2', () => {
  const dataMap = new Map();
  h.populateDataMap(dataMap, 'fill', null, 3);
  expect(dataMap).toStrictEqual(new Map([['0', 0], ['1', 1], ['2', 2]]));
});
test('populateDataMap, 3', () => {
  const dataMap = new Map();
  h.populateDataMap(dataMap, 'fill');
  expect(dataMap).toStrictEqual(new Map());
});
test('populateDataMap, 4', () => {
  expect(() => h.populateDataMap(new Map(), 'fill', {}))
    .toThrow('fillOrder is not an array')
});
test('populateDataMap, 5', () => {
  expect(() => h.populateDataMap(new Map(), 'fill', ['a', 'b', 5, 'd']))
    .toThrow('fillOrder contains a number');
});
test('populateDataMap, 6', () => {
  expect(() => h.populateDataMap(new Map(), 'fill', ['a', 'b', undefined, 'd']))
    .toThrow('fillOrder contains a null or undefined value')
});
test('populateDataMap, 7', () => {
  expect(() => h.populateDataMap(new Map(), 'fill', ['red', 'blue', 'red']))
    .toThrow('fillOrder contains a duplicate')
});
test('populateDataMap, 8', () => {
  expect(() => h.populateDataMap(new Map(), 'fill', null, 0))
    .toThrow('fillSeq must be a positive integer');
});


test('updateDataMap, 1', () => {
  const dataMap = new Map([['apple', 0], ['banana', 1]]);
  const val = h.updateDataMap(dataMap, 4);
  expect([val, dataMap]).toStrictEqual(
    [4, new Map([['apple', 0], ['banana', 1]])]
  );
});
test('updateDataMap, 2', () => {
  const dataMap = new Map([['apple', 0], ['banana', 1]]);
  const val = h.updateDataMap(dataMap, 'banana');
  expect([val, dataMap]).toStrictEqual(
    [1, new Map([['apple', 0], ['banana', 1]])]
  );
});
test('updateDataMap, 3', () => {
  const dataMap = new Map([['apple', 0], ['banana', 1]]);
  const val = h.updateDataMap(dataMap, 'cherry');
  expect([val, dataMap]).toStrictEqual(
    [2, new Map([['apple', 0], ['banana', 1], ['cherry', 2]])]
  );
});

test('useColorScheme, 1', () => {
  const scheme = v => `rgb(${v * 255}, 0, 0)`;
  const mk = { type: 'vbar', fillLimits: [2, Infinity] };
  const ch = 'fill';
  expect(() => h.useColorScheme(5, scheme, mk, ch))
    .toThrow('mark-vbar, channel-fill, fill limits are not finite')
});
test('useColorScheme, 2', () => {
  const scheme = v => `rgb(${v * 255}, 0, 0)`;
  const mk = { type: 'vbar', fillLimits: [10, 5] };
  const ch = 'fill';
  expect(() => h.useColorScheme(5, scheme, mk, ch))
    .toThrow(
      'mark-vbar, channel-fill, fill limits are equal or the wrong way round')
});
test('useColorScheme, 3', () => {
  const scheme = v => `rgb(${Math.round(v * 255)}, 0, 0)`;
  const mk = { type: 'vbar', fillLimits: [2, 10] };
  const ch = 'fill';
  expect(h.useColorScheme(8.2744, scheme, mk, ch))
    .toStrictEqual({data: 'rgb(200, 0, 0)', info: {min: 2, max: 10, scheme}})
});
test('useColorScheme, 4', () => {
  const scheme = v => `rgb(${Math.round(v * 255)}, 0, 0)`;
  const mk = { type: 'vbar', fillLimits: [2, 10] };
  const ch = 'fill';
  expect(h.useColorScheme([5.1373, 8.2744], scheme, mk, ch))
    .toStrictEqual({
      data: ['rgb(100, 0, 0)', 'rgb(200, 0, 0)'],
      info: {min: 2, max: 10, scheme}
    })
});
test('useColorScheme, 5', () => {
  const scheme = ['red', 'blue', 'green'];
  const mk = { type: 'vbar' };
  const ch = 'fill';
  expect(h.useColorScheme(1, scheme, mk, ch))
    .toStrictEqual({ data: 'blue', info: { scheme }})
});
test('useColorScheme, 6', () => {
  const scheme = ['red', 'blue', 'green'];
  const mk = { type: 'vbar' };
  const ch = 'fill';
  expect(h.useColorScheme([2, 0, 2], scheme, mk, ch))
    .toStrictEqual({ data: ['green', 'red', 'green'], info: { scheme }})
});

test('equalTo, 1', () => { 
  expect(h.equalTo(5, 5 + 1e-16)).toBe(true)
});
test('equalTo, 2', () => { 
  expect(h.equalTo(5, 5.001)).toBe(false)
});

test('magnitude, 1', () => { 
  expect(h.magnitude(-16.372)).toBe(1)
});
test('magnitude, 2', () => { 
  expect(h.magnitude(0.00463)).toBe(-3)
});

test('magnitude10, 1', () => { 
  expect(h.magnitude10(-16.372)).toBe(1)
});
test('magnitude10, 2', () => { 
  expect(h.magnitude10(0.001)).toBe(-4)
});

test('roundToMagnitude, 1', () => { 
  expect(h.roundToMagnitude(27963, 1)).toBe(27960)
});
test('roundToMagnitude, 2', () => { 
  expect(h.roundToMagnitude(27963, 1, 'up')).toBe(27970)
});
test('roundToMagnitude, 3', () => { 
  expect(h.roundToMagnitude(27963, 2, 'down')).toBe(27900)
});
test('roundToMagnitude, 4', () => { 
  expect(h.roundToMagnitude(27960, 1)).toBe(27960)
});
test('roundToMagnitude, 5', () => { 
  expect(h.roundToMagnitude(0.254, -2)).toBeCloseTo(0.25)
});
test('roundToMagnitude, 6', () => { 
  expect(h.roundToMagnitude(-0.254, -2)).toBeCloseTo(-0.25)
});

test('enforceRound, 1', () => { 
  expect(h.enforceRound(0.01200001, -3)).toBe(0.012)
});
test('enforceRound, 2', () => { 
  expect(h.enforceRound(4700, 2)).toBe(4700)
});

test('accuracy, 1', () => { 
  expect(h.accuracy(47300)).toBe(2)
});
test('accuracy, 2', () => { 
  expect(h.accuracy(28.00500)).toBe(-3)
});

test('hBarValues, 1', () => {
  expect(h.hBarValues({
    x: 5, xx: 12, y: 2, h: 6
  })).toStrictEqual({
    width: 7, height: 6, xCorner: 5, yCorner: -1
  })
});

test('vBarValues, 1', () => {
  expect(h.vBarValues({
    x: 10, y: 40, yy: 5, w: 3
  })).toStrictEqual({
    width: 3, height: 35, xCorner: 8.5, yCorner: 5
  })
});

// tests from d3-polygon: https://github.com/d3/d3-polygon
test('polygonCentroid, 1', () => {
  expect(h.polygonCentroid([
    [0, 0], [0, 1], [1, 1], [1, 0], [0, 0]
  ])).toStrictEqual([0.5, 0.5])
});
test('polygonCentroid, 2', () => {
  expect(h.polygonCentroid([
    [0, 0], [1, 0], [1, 1], [0, 1], [0, 0]
  ])).toStrictEqual([0.5, 0.5])
});
test('polygonCentroid, 3', () => {
  expect(h.polygonCentroid([
    [1, 1], [3, 2], [2, 3], [1, 1]
  ])).toStrictEqual([2, 2])
});
test('polygonCentroid, 4', () => {
  expect(h.polygonCentroid([
    [0, 0], [0, 1], [1, 1], [1, 0]
  ])).toStrictEqual([0.5, 0.5])
});
test('polygonCentroid, 5', () => {
  expect(h.polygonCentroid([
    [0, 0], [1, 0], [1, 1], [0, 1]
  ])).toStrictEqual([0.5, 0.5])
});
test('polygonCentroid, 6', () => {
  expect(h.polygonCentroid([
    [1, 1], [3, 2], [2, 3]
  ])).toStrictEqual([2, 2])
});

test('range, 1', () => {
  expect(h.range(5, 5)).toStrictEqual([])
});
test('range, 2', () => {
  expect(h.range(1, 2)).toStrictEqual([1, 2])
});
test('range, 3', () => {
  expect(h.range(3, 6)).toStrictEqual([3, 4, 5, 6])
});
test('range, 4', () => {
  expect(h.range(0, 4, 2)).toStrictEqual([0, 2, 4])
});
test('range, 5', () => {
  expect(h.range(1.5, -4, -2)).toStrictEqual([1.5, -0.5, -2.5])
});

test('linSpace, 1', () => {
  expect(h.linSpace(5, 5, 0)).toStrictEqual([])
});
test('linSpace, 2', () => {
  expect(h.linSpace(5, 5, 1)).toStrictEqual([5])
});
test('linSpace, 3', () => {
  expect(h.linSpace(5, 5, 3)).toStrictEqual([5, 5, 5])
});
test('linSpace, 4', () => {
  expect(h.linSpace(2, 5, 4)).toStrictEqual([2, 3, 4, 5])
});
test('linSpace, 5', () => {
  expect(h.linSpace(1.5, -4, 3)).toStrictEqual([1.5, -1.25, -4])
});