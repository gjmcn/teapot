////////////////////////////////////////////////////////////////////////////////
// tp class.
////////////////////////////////////////////////////////////////////////////////

import merge from 'lodash-es/merge.js';
import cloneDeep from 'lodash-es/cloneDeep.js';
import * as d3 from 'd3-shape';
import { h } from './helpers.js';
import { defOptions } from './def-options.js';
import { defChannels } from './def-channels.js';
import { defShapeScheme } from './def-shape-scheme.js';

let clipCount = 0;

export class tp {

  constructor() {
    this._marks = [];
    this._dataset = null;
    this._options = {};
    this._state = null;
  }

  plot(target) {

    const { _marks, _dataset, _options } = this;
    const _state = _options._outerContainer
      ? _options._outerContainer.__tp__.state
      : cloneDeep(this._state);

    if (_marks.length === 0) throw Error('plot has no marks');

    // local helpers
    function op(name) {
      return _options[name] ?? defOptions[name];
    }
    function setAttr(elm, attrName, opName) {
      elm.setAttribute(attrName, op(opName));
    }
    function setDimAttr(elm, dim, attrName, opName) {
      elm.setAttribute(
        attrName,
        op(dim + h.capitalize(opName)) ?? op(opName)
      );
    }


  
      !!!!!!!!!!!!!!CHECKED TO HERE!!!!!!!!!!!!!!!!!!!!!!!!!!!1



}