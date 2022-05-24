////////////////////////////////////////////////////////////////////////////////
// Helper functions and constants.
////////////////////////////////////////////////////////////////////////////////

import { defShapeScheme } from './def-shape-scheme.js';
import { defChannels } from './def-channels.js';
import { defOptions } from './def-options.js';
import { shapeDetails } from './constants.js';

let gradientCount = 0;

export const h = {


  // ========== iterables ==========

  // true if callback truthy for any element
  some(iterable, f) {
    let j = 0;
    for (let v of iterable) {
      if (f(v, j++, iterable)) return true;
    }
    return false;
  },

  // true if callback truthy for every element
  every(iterable, f) {
    let j = 0;
    for (let v of iterable) {
      if (!f(v, j++, iterable)) return false;
    }
    return true;
  },

  // iterable of elements
  iterableOfElelements(elmts) {
    if (typeof elmts === 'string') {
      return [...document.querySelectorAll(elmts)];
    }
    else if (typeof elmts?.[Symbol.iterator] === 'function') {
      return elmts;
    }
    else {
      return [ elmts ];
    } 
  },


  // ========== other ==========

  isNullish(v) {
    return v === undefined || v === null;
  },

  // kind of channel
  getKind(ch) {
    return defChannels.get(ch)._kind;
  },

  // mark-channel error message
  markChannelError(mk, ch, msg) {
    throw Error(`mark-${mk}, channel-${ch}, ${msg}`);
  },

  // test if value is Infinity, -Infinity or NaN
  isInfOrNaN(val) {
    return Number.isNaN(val) || val === Infinity || val === -Infinity;
  },

  // error messages
  nonFiniteMsg: 'non-finite data value (NaN, Infinity or -Infinity)',
  allMissingMsg: 'every datum has a missing value',

  // is array of objects/arrays?
  isArrayOfObjects(d) {
    return Array.isArray(d) &&
      d.every(a => typeof a === 'object' && a !== null);
  },

  // get dataset
  getDataset(ds) {
    if (Number.isInteger(ds) && ds > 0) {
      const data = [];
      for (let i = 0; i < ds; i++) data.push(i);
      return data;
    }
    else if (!Array.isArray(ds)) {
      throw Error('dataset must be an array or a positive integer');
    }
    else if (ds.length === 0) {
      throw Error('dataset cannot be empty')
    }
    return ds;
  },

  // captitalize first character of string
  capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
  },

  // camel case to kebab case
  camelToKebab(s) {
    return s.replace(/[A-Z]/g, u => `-${u.toLowerCase()}`);
  },

  // crop tilde
  cropTilde(s) {
    return typeof s === 'string' && s[0] === '~' ? s.slice(1) : s;
  },

  // min/max of array where ignore undefined and null elements
  minVal(arr) {
    let mn = Infinity;
    for (let v of arr) {
      if (v !== null && v !== undefined && v < mn) mn = v;
    }
    return mn;
  },
  maxVal(arr) {
    let mx = -Infinity;
    for (let v of arr) {
      if (v !== null && v !== undefined && v > mx) mx = v;
    }
    return mx;
  },

  // check shape scheme, returns the scheme
  checkShapeScheme(scheme, mk) {
    if (scheme !== defShapeScheme &&
        h.some(scheme, a => !defShapeScheme.includes(a))) {
      throw Error(`mark-${mk.type}, invalid shape name`);
    }
    return scheme;
  },

  // check data array and get indices of missing values
  checkData(arr, mk, ch) {
    if (arr.length === 0) {
      h.markChannelError(mk.type, ch, 'empty data array');
    }
    if (h.some(arr, h.isInfOrNaN)) {
      h.markChannelError(mk.type, ch, h.nonFiniteMsg);
    }
    let missingInds;
    if (mk.missing === 'skip' || mk.missing === 'gap') {
      missingInds = new Set();
      for (let i = 0; i < arr.length; i++) {
        if (h.isNullish(arr[i])) {
          missingInds.add(i);
        }
      }
      if (missingInds.size === arr.length) {
        h.markChannelError(mk.type, ch, h.allMissingMsg);
      }
    }
    else {
      if (h.some(arr, h.isNullish)) {
        h.markChannelError(mk.type, ch, 'missing data value');
      }
    }
    return { data: arr, missingInds }; 
  },
  
  // get channel default
  getChannelDefault(mk, ch) {
    const obj = defChannels.get(ch);
    return obj.hasOwnProperty(mk.type) ? obj[mk.type] : obj.def;
  },
    
  // get option that can be a 4-array or a number - assume default is a number
  fourOption(_options, opName) { 
    const passed = _options[opName];
    const def = defOptions[opName];
    const r = new Array(4);
    if (Array.isArray(passed)) {
      for (let i = 0; i < 4; i++) r[i] = passed[i] ?? def;
    }
    else {
      for (let i = 0; i < 4; i++) r[i] = passed ?? def;
    }
    return r;
  },
  
  // populate data map from order or seq option
  populateDataMap(dMap, ch, orderOp, seqOp) {
    if (!h.isNullish(orderOp)) {
      if (!Array.isArray(orderOp)) {
        throw Error(`${ch}Order is not an array`);
      }
      if (orderOp.some(a => typeof a === 'number')) {
        throw Error(`${ch}Order contains a number`);
      }
      if (orderOp.some(h.isNullish)) {
        throw Error(`${ch}Order contains a null or undefined value`);
      }
      if (new Set(orderOp).size < orderOp.length) {
        throw Error(`${ch}Order contains a duplicate`);
      }
      for (let val of orderOp) {
        dMap.set(val, dMap.size);
      }
    }
    else if (!h.isNullish(seqOp)) {
      if (!Number.isInteger(seqOp) || seqOp <= 0) {
        throw Error(`${ch}Seq must be a positive integer`);
      }
      for (let j = 0; j < seqOp; j++) {
        dMap.set(String(j), j);
      }
    }
  },
  
  // update data map: adds key if unused (and not a number), returns value
  updateDataMap(dataMap, key) {
    if (typeof key === 'number') {
      return key;
    }
    else if (dataMap.has(key)) {
      return dataMap.get(key);
    }
    else {
      const sz = dataMap.size;
      dataMap.set(key, sz);
      return sz;
    }
  },

  // set attribute unless value is nullish, return the element
  setUnlessNullish(elm, attrName, val) {
    if (!h.isNullish(val)) {
      elm.setAttribute(attrName, val);
    }
    return elm;
  },
  
  // use color scheme - mutates data if it is an array
  useColorScheme(data, scheme, mk, ch) {
    const isConst = !Array.isArray(data);
    let info;
    if (typeof scheme === 'function') { // continuous scheme
      let [mn, mx] = mk[`${ch}Limits`] ?? [null, null];
      mn = Number(mn ?? (isConst ? data : h.minVal(data)));
      mx = Number(mx ?? (isConst ? data : h.maxVal(data)));
      if (!Number.isFinite(mn) || !Number.isFinite(mx)) {
        h.markChannelError(mk.type, ch, `${ch} limits are not finite`);
      }
      if (mx - mn < 1e-14) {
        h.markChannelError(mk.type, ch,
          `${ch} limits are equal or the wrong way round`);
      }
      const rng = mx - mn;
      if (isConst) {
        data = scheme((data - mn) / rng);
      }
      else {
        for (let i = 0; i < data.length; i++) {
          data[i] = scheme((data[i] - mn) / rng);
        }
      }
      info = { min: mn, max: mx, scheme };
    }
    else {  // discrete scheme
      if (isConst) {
        data = scheme[data];
      }
      else {
        for (let i = 0; i < data.length; i++) {
          data[i] = scheme[data[i]];
        }
      }
      info = { scheme };
    }
    return { data, info };
  },

  // approx equal to    
  equalTo(u, v) {
    return Math.abs(u - v) < 1e-14;
  },

  // magnitude of a number: its index in standard form
  magnitude(v) {
    const sf = v.toExponential();
    return Number(sf.slice(sf.indexOf('e') + 1));
  },
  
  // as magnitude, but if v is a power of 10, return an index of 1 less
  magnitude10(v) {
    const m = h.magnitude(v);
    return h.equalTo(10 ** m, v) ? m - 1 : m;
  },

  // round to given magnitude
  roundToMagnitude(v, mag, upDown) {
    const magVal = 10 ** mag;
    v = v / magVal;
    const r = Math.round(v);
    if      (h.equalTo(v, r))   v = r;
    else if (upDown === 'up')   v = Math.ceil(v);
    else if (upDown === 'down') v = Math.floor(v);
    else                        v = r;
    return h.enforceRound(v * magVal, mag);
  },

  // assume v rounded to mag, but now enforce that rounded to mag exactly: for
  // decimals, removes tiny delta caused by floating point issues
  enforceRound(v, mag) {
    return mag < 0 ? Number(v.toFixed(Math.abs(mag))) : v;
  },

  // magnitude of highest precision digit
  // (should only use where expect t to have few significant figures)
  accuracy(t) {
    const m = h.magnitude(t);
    let s = 1;
    while (true) {
      if (h.equalTo(Number(t.toPrecision(s)), t)) break;
      if (s === 14) throw Error('failed to compute accuracy');
      s++;
    }
    return m - s + 1;
  },
  
  // get text width
  getTextWidth(ctx, txt) {
    return ctx.measureText(txt).width;
  },

  // create svg element
  svgElmt(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  },
  
  // point symbol: modifies ops.path or creates new path; returns the path
  pointSymbol(ops) {
    let { path, shape, area, x, y } = ops;
    const { name, rotate } = shapeDetails[shape];
    let tform = `translate(${x} ${y})`;
    if (rotate) tform += ` rotate(${rotate})`;
    path ??= svgElmt('path');
    path.setAttribute('d', d3.symbol(d3[`symbol${name}`], area)());
    path.setAttribute('transform', tform);
  },
  
  // horizontal bar attribute values
  hBarValues(ops) {
    return {
      width:   Math.abs(ops.x - ops.xx),
      height:  ops.h,
      xCorner: Math.min(ops.x, ops.xx),
      yCorner: ops.y - (ops.h / 2)
    };
  },

  // vertical bar attribute values
  vBarValues(ops) {
    return {
      width:   ops.w,
      height:  Math.abs(ops.y - ops.yy),
      xCorner: ops.x - (ops.w / 2),
      yCorner: Math.min(ops.y, ops.yy),
    };
  },

  // d attribute for edge mark
  dEdge(values) {
    const { x, xx, y, yy, size, clockwise } = values;
    const r = Math.sqrt((x - xx) ** 2 + (y - yy) ** 2) / 2 / (size ** (1 / 3));
    return `M ${x},${y} A ${r} ${r} 0 0 ${clockwise} ${xx},${yy}`;
  },

  // d attribute for line or band
  dLineBand(ops) {
    const { missing, nObs, type, curveType, presentInds, x, xx, y, yy } = ops;
    const lineFunc = (type === 'line'
        ? d3.line(a => x(a), a => y(a))
        : type === 'hBand'  // else vBand
          ? d3.area.x(a => x(a)).y0(a => y(a)).y1(a => yy(a))
          : d3.area.x0(a => x(a)).x1(a => xx(a)).y(a => y(a))
      ).curve(d3[`curve${h.capitalize(curveType)}`]);
    return missing === 'gap'
      ? lineFunc.defined(a => presentInds.has(a))(
          (function*() {for (let i = 0; i < nObs; i++) yield i})()
        )
      : lineFunc(presentInds);
  },
  
  // set text transform
  setTextTransform(elm, x, y, rot) {
    return elm.setAttribute('transform',
      `${h.isNullish(rot) ? '' : `rotate(${rot},${x},${y}) `
        }translate(${x},${y})`
    );
  },

  // set transition
  setTransition(elm, delay, duration, ease) {
    if (delay || duration) {
      elm.style.setProperty('transition',
      `all ${duration || 0}ms ${ease} ${delay || 0}ms`);
    }
    else {
      elm.style.removeProperty('transition');
    }
    return elm;
  },
  
  // set initial transition
  setTransitionInitial(elm, channels, i) {
    return h.setTransition(
      elm,
      channels.delay(i),
      channels.duration(i),
      channels.ease(i)
    );
  },
  
  // polygon centroid, from d3-polygon: https://github.com/d3/d3-polygon
  polygonCentroid(p) {
    let i = -1,
        n = p.length,
        x = 0,
        y = 0,
        a = null,
        b = p[n - 1],
        c = null,
        k = 0;
    while(true) {
      i += 1;
      if (i < n) {
        a = b;
        b = p[i];
        c = a[0] * b[1] - b[0] * a[1];
        k += c;
        x += (a[0] + b[0]) * c;
        y += (a[1] + b[1]) * c;
      }
      else {
        break;
      }
    }
    k *= 3;
    return [x / k, y / k];
  },

  // range
  range(s, e, j = 1) {
    s = +s, e = +e, j = +j;
    e += (e - s) * 1e-14;
    const r = [];
    while (j > 0 ? s < e : s > e) {
      r.push(s);
      s += j;
    }
    return r;
  },

  // lin space
  linSpace(s, e, n) {
    s = +s, e = +e, n = +n;
    if (n === 1) return [(s + e) / 2];
    const j = (e - s) / (n - 1);
    const r = [];
    s = s - j;
    for (let i = 0; i < n; i++) r.push(s += j);
    return r;
  },

  // color ramp
  colorRamp(schemeFun, width, height) {
    const id = `legend-gradient-${gradientCount}`;
    gradientCount += 1;
    const g = h.svgElmt('g');
    const defs = g.insertBefore(h.svgElmt('defs'), null);
    const grad = defs.insertBefore(h.svgElmt('linearGradient'), null);
    grad.setAttribute('id', id);
    grad.setAttribute('gradientTransform', 'rotate(90)');
    for (let v of h.linSpace(0, 1, 16)) {
      const stp = grad.insertBefore(h.svgElmt('stop'), null);
      stp.setAttribute('offset', v * 100 + '%');
      stp.setAttribute('stop-color', schemeFun(1 - v));
    }
    const rect = g.insertBefore(h.svgElmt('rect'), null);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', `url(#${id})`);
    return g;
  },

  // add to target
  addToTarget(content, target) {
    if (target) {
      (typeof target === 'string' ? document.querySelector(target) : target)
        .append(content);
    }
    return content;
  },

}