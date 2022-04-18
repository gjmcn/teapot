////////////////////////////////////////////////////////////////////////////////
// Channel defaults.
////////////////////////////////////////////////////////////////////////////////

export const defChannels = new Map([

  // common
  [ 'x', { _kind: 'common', def: 0}],
  [ 'y', { _kind: 'common', def: 0}],
  [ 'xOffset', { _kind: 'common', def: 0}],
  [ 'yOffset', { _kind: 'common', def: 0}],
  [ 'fill', {
    _kind: 'common', 
    def: 'gray',
    point: 'black',
    circle: 'black',
    text: 'black',
    segment: 'none',
    hLink: 'none',
    vLink: 'none',
    edge: 'none',
    path: 'none',
    line: 'none'
  }],
  [ 'fillOpacity', {
    _kind: 'common',
    _attr: true,
    def: 1,
    point: 0.7,
    circle: 0.7
  }],
  [ 'stroke', { _kind: 'common', def: 'black' }],
  [ 'strokeOpacity', { _kind: 'common', _attr: true, def: 1 }],
  [ 'strokeWidth', {
    _kind: 'common',
    _attr: true,
    def: 0,
    segment: 1.5,
    hLink: 1.5,
    vLink: 1.5,
    edge: 1.5,
    path: 1.5,
    line: 1.5
  }],
  [ 'strokeCap',  { _kind: 'common', _attr: 'stroke-linecap',   def: null }],
  [ 'strokeDash', { _kind: 'common', _attr: 'stroke-dasharray', def: null }],
  [ 'front',      { _kind: 'common', def: 0    }],
  [ 'class',      { _kind: 'common', def: null }],
  [ 'name',       { _kind: 'common', def: null }],
  [ 'listen',     { _kind: 'common', def: true }],
  [ 'click',      { _kind: 'common', def: null }],
  [ 'mouseenter', { _kind: 'common', def: null }],
  [ 'mouseleave', { _kind: 'common', def: null }],

  // text (used by note for mark types other than text)
  [ 'fontSize',   { _kind: 'text', def: null }],
  [ 'fontFamily', { _kind: 'text', _attr: true, def: null}],
  [ 'fontStyle',  { _kind: 'text', _attr: true, def: null}],
  [ 'fontWeight', { _kind: 'text', _attr: true, def: null}],
  [ 'hAlign',     {
    _kind: 'text',
    _attr: 'text-anchor',
    def: 'middle',
    segment: 'start',
    hLink: 'start',
    edge: 'start',
    hBar: 'start',
    line: 'start',
    hBand: 'start'
  }],
  [ 'vAlign', {
    _kind: 'text',
    _attr: 'dominant-baseline',
    def: 'middle',
    point: 'auto',
    circle: 'auto',
    vLink: 'auto',
    vBar: 'auto',
    vBand: 'auto'
  }],
  [ 'rotate',  { _kind: 'text', def: null }],

  // note
  [ 'note',        { _kind: 'note', def: null }],
  [ 'noteColor',   { _kind: 'note', def: 'black' }],
  [ 'noteOpacity', { _kind: 'note', def: 1 }],
  [ 'noteXOffset', {
    _kind: 'note',
    def: 0,
    segment: 4,
    hLink: 4,
    edge: 4,
    hBar: 4,
    line: 4,
    hBand: 4
  }],
  [ 'noteYOffset', { 
    _kind: 'note',
    def: 0,
    point: 8,
    circle: 8,
    vLink: 5,
    vBar: 5,
    vBand: 5
  }],

  // special
  [ 'shape', { _kind: 'special', point: 0 }],
  [ 'area', { _kind: 'special',  point: 36, circle: 36 }],
  [ 'size', { _kind: 'special',  hBar: 0.9, vBar: 0.9, edge: 0.5 }],
  [ 'xx', {
    _kind: 'special',
    hBar: 0,
    segment: 0,
    hLink: 0,
    vLink: 0,
    edge: 0,
    vBand: 0
  }],
  [ 'yy',           {
    _kind: 'special',
    vBar: 0,
    segment: 0,
    hLink: 0,
    vLink: 0,
    edge: 0,
    hBand: 0
  }],
  [ 'width',        { _kind: 'special',  rect: 1 }],
  [ 'height',       { _kind: 'special',  rect: 1 }],
  [ 'cornerRadius', {
    _kind: 'special',
    rect: null,
    arc: null,
    hBar: null,
    vBar: null
  }],
  [ 'startAngle',   { _kind: 'special',  arc: 0 }],
  [ 'endAngle',     { _kind: 'special',  arc: (2 * Math,PI) }],
  [ 'outerRadius',  { _kind: 'special',  arc: 80 }],
  [ 'innerRadius',  { _kind: 'special',  arc: 0 }],
  [ 'padAngle',     { _kind: 'special',  arc: 0 }],
  [ 'padRadius',    { _kind: 'special',  arc: 0 }],
  [ 'pie',          { _kind: 'special',  arc: null }],
  [ 'clockwise',    { _kind: 'special',  edge: true }],
  [ 'text',         { _kind: 'special',  text: '' }],
  [ 'path',         { _kind: 'special',  path: null }],
  [ 'subplot',      { _kind: 'special',  rect: null }],
  [ 'delay',        {
    _kind: 'special',
    circle: 0,
    rect: 0,
    hBar: 0,
    vBar: 0,
    text: 0
  }],
  [ 'duration', {
    _kind: 'special',
    circle: 0,
    rect: 0,
    hBar: 0,
    vBar: 0,
    text: 0
  }],
  [ 'ease', {
    _kind: 'special',
    circle: 'linear',
    rect: 'linear',
    hBar: 'linear',
    vBar: 'linear',
    text: 'linear'
  }]

]);