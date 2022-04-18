////////////////////////////////////////////////////////////////////////////////
// Option defaults.
////////////////////////////////////////////////////////////////////////////////

export const defOptions = {

  // basic
  plot: true,
  setPaneSize: false,
  width: 260,
  height: 260,
  background:'transparent',
  paneBackground: 'transparent',
  paneBorderWidth: 0,
  paneBorderColor: '#888',
  clip: false,
  limits: '_nice',
  plotSpace: 12,  // default must be a number

  // titles and labels
  fontFamily: 'sans-serif',
  fontSize: 11,
  plotTitleFontSize: 12,
  fontStyle: 'normal',
  fontWeight: 'normal',
  plotTitleFontWeight: 'bolder',
  xTitleFontWeight: 'bolder',
  yTitleFontWeight: 'bolder',
  legendTitleFontWeight: 'bolder',
  color: 'black',
  opacity: 1,

  // title and label alignment
  plotTitleAlign: 'middle',
  plotTitleOffset: 0,
  xTitleAlign: 'middle',
  xTitleOffset: 0,
  yTitleAlign: 'middle',
  yTitleOffset: 0,
  xLabelAlign: 'middle',
  xLabelOffset: 0,
  yLabelAlign: 'middle',
  yLabelOffset: 0,

  // padding
  plotTitlePadding: 12,
  xTitlePadding: 5,
  yTitlePadding: 10,
  xLabelPadding: 3,
  yLabelPadding: 2,
  xAxisPadding: 0,
  yAxisPadding: 0,
  legendGap: 20,
  legendPadding: 0,  // default must be a number
  legendLabelPadding: 4,

  // axis, grid and ticks
  axis: true,
  axisWidth: 1,
  axisColor: '#888',
  axisOpacity: 1,
  grid: true,
  gridWidth: 1,
  gridColor: '#ddd',
  gridOpacity: 1,
  ticks: true,
  tickLength: 5,
  tickWidth: 1,
  tickColor: '#888',
  tickOpacity: 1,
  labels: true,
  xReverse: false,
  yReverse: false,
  xTickMin: false,
  xTickMax: false,
  yTickMin: false,
  yTickMax: false,
  xAxisPosition: 'bottom',
  yAxisPosition: 'left',

  // legend
  legend: true,
  legendPosition: 'out-right',
  legendBackground: 'transparent',
  legendBackgroundOpacity: 1,
  legendBorderColor: '#888',
  legendBorderWidth: 0,
  legendCornerRadius: 0,

};