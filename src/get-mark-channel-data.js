////////////////////////////////////////////////////////////////////////////////
// Get mark-channel data.
////////////////////////////////////////////////////////////////////////////////

!!!! CHECK THIS !!!!!!!!!!!!!!!!

import { h } from './helpers.js'

// get mark-channel data
export function getMarkChannelData(mk, ch, markUpdate, _this) {
      
  const data = mk[ch];
  const isSubplot = ch === 'subplot';
  const isHandler = handlerChannelNames.has(ch);
  const isSingleMarkNonXY =
    singleMarkNames.has(mk.type) && !xyChannelNames.has(ch);

  // nullish constant
  if (h.isNullish(data)) {
    return { isConst: true, data: getChannelDefault(mk, ch) };
  }

  // data array
  if (Array.isArray(data)) {
    if (isSubplot || isHandler || isSingleMarkNonXY) {
      throw Error(h.markChannelError(mk.type, ch, 'unexpected array'));
    }
    return h.checkData([...data], mk, ch);
  }

  // ~string or accessor
  if ((typeof data === 'string' && data[0] === '~') ||
       typeof data === 'function') {

    // get dataset
    const ds = mk.data ?? _this._dataset;
    if (!ds) {
        h.markChannelError(mk.type, ch,
          'no dataset attached to mark or plot');
    }

    // ~string
    if (typeof data === 'string') {
      if (isSubplot || isHandler || isSingleMarkNonXY) {
        h.markChannelError(mk.type, ch, 'unexpected ~string');
      }
      return h.checkData(h.pick(ds, data.slice(1)), mk, ch);
    }

    // function
    // check if function has state param - and if allowed to
    const hasStateParam = data.length > 2;
    if (hasStateParam) {
      if (nonUpdateChannelNames.has(ch) || isHandler) {
        h.markChannelError(mk.type, ch, 'channel is not updatable');
      }
      if (defChannels.get(ch)._kind === 'text' && (mk.type !== 'text')) {
        h.markChannelError(mk.type, ch,
          'channel is not updatable unless used with a text mark');
      }
      if (mk.type === 'rect' && !h.isNullish(mk.subplot)) {
        h.markChannelError(mk.type, ch,
          'channel is not updatable since rect is a subplot');
      }
    }

    // single-mark, non-xy channel - pass entire data set
    if (isSingleMarkNonXY) {
      if (isHandler) {
        return { isConst: true, data: ds };  // not used, handlers lookup dataset directly
      }
      else {
        if (hasStateParam) {
          markUpdate.set(ch, s => data(ds, null, s));  // 1 parameter indicates constant when update
        }
        const val = data(ds, null, _this._state);
        if (h.isInfOrNaN(val)) h.markChannelError(mk.type, ch, h.nonFiniteMsg);
        return { isConst: true, data: val ?? h.getChannelDefault(mk, ch) };
      }
    }

    // standard behavior - pass datum
    if (isHandler) {
      // not used, handlers lookup dataset directly (though is used in that
      // length of data must be consistent with other channels)
      return { isConst: false, data: ds };
    }
    if (hasStateParam) {
      // 2 parameters indicates non-constant when update
      return markUpdate.set(ch, (i, s) => data(ds[i], i, s));
    }
    if (isSubplot) {
      return { isConst: false, data: ds };
    }
    return checkData(ds.map((d, i) => data(d, i, _this._state), mk, ch));
  
  }
    
  // constant
  if (isSubplot || isHandler) {
    h.markChannelError(mk.type, ch, 'unexpected constant value');
  }
  if (h.isInfOrNaN(data)) {
    h.markChannelError(mk.type, ch, nonFiniteMsg);
  }
  return {isConst: true, data };

}