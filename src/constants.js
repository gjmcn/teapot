
import { defChannels } from "./def-channels.js";  

// all mark names
export const markNames = new Set([
  'hBar',
  'vBar',
  'point',
  'circle',
  'rect',
  'segment',
  'hLink',
  'vLink',
  'arc',
  'edge',
  'text',
  'path',
  'line',
  'hBand',
  'vBand'
]);

// single marks
export const singleMarkNames = new Set([
  'line',
  'hBand',
  'vBand'
]);

// marks that can use transition channels
export const transitionMarkNames = new Set([
  'circle',
  'hBar',
  'vBar',
  'rect',
  'text'
]);

// channel names
export const channelNames = new Set(defChannels.keys());

// channels that cannot be updated
// (note that handlerChannelNames also cannot be updated)
export const nonUpdateChannelNames = new Set([
  'xOffset',
  'yOffset',
  'class',
  'name',
  'note',
  'noteColor',
  'noteOpacity',
  'noteXOffset',
  'noteYOffset',
  'subplot'
]);

// handler channels
export const handlerChannelNames = new Set([
  'mouseenter',
  'mouseleave',
  'click'
]);

// x and y channels
export const xyChannelNames = new Set([
  'x',
  'xx',
  'y',
  'yy'
]);

// common channels not used by path
export const nonPathChannelNames = new Set([
  'x',
  'y',
  'xOffset',
  'yOffset'
]);

// fill and stroke channels used in legend
export const legendFillStrokeChannels = new Set([
  'fill',
  'fillOpacity',
  'stroke',
  'strokeOpacity',
  'strokeWidth',
  'strokeDash'
]);

// angle channels
export const angleChannels = new Set([
  'startAngle',
  'endAngle',
  'padAngle'
]);

// curve types
export const curveTypes = new Set([
  'basis',
  'basisOpen',
  'bundle',
  'cardinal',
  'cardinalOpen',
  'catmullRom',
  'catmullRomOpen',
  'linear',
  'monotoneX',
  'monotoneY',
  'natural',
  'curveStep',
  'curveStepAfter',
  'curveStepBefore',
  'basisClosed',
  'cardinalClosed',
  'catmullRomClosed',
  'linearClosed'
]);

// shape info
// (xMult, yMult, xShift and yShift used in legend spacing hack)
export const shapeDetails = {
  circle:           { name: 'Circle',   xMult: 1.138,  yMult: 1.138 },
  square:           { name: 'Square',   xMult: 1,      yMult: 1 },
  diamond:          { name: 'Square',   xMult: 1.414,  yMult: 1.414,                 rotate:  45 },
  star:             { name: 'Star',     xMult: 1.777,  yMult: 1.777 },
  wye:              { name: 'Wye',      xMult: 1.469,  yMult: 1.469 },
  'triangle-up':    { name: 'Triangle', xMult: 1.477,  yMult: 1.3,    yShift:  0.2 },
  'triangle-down':  { name: 'Triangle', xMult: 1.477,  yMult: 1.3,    yShift: -0.2,  rotate: 180 },
  'triangle-right': { name: 'Triangle', xMult: 1.3,    yMult: 1.477,  xShift: -0.15, rotate:  90 },
  'triangle-left':  { name: 'Triangle', xMult: 1.3,    yMult: 1.477,  xShift:  0.15, rotate: 270 },
  plus:             { name: 'Cross',    xMult: 1.331,  yMult: 1.331 },
  times:            { name: 'Cross',    xMult: 1.254,  yMult: 1.254,                 rotate:  45 }
};