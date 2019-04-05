const CIRCLE_DATA = 'data:image/svg+xml;base64,PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxOHB4IiBoZWlnaHQ9IjE4cHgiIHZlcnNpb249IjEuMSI+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjUiIHN0cm9rZT0iI2ZmZiIgZmlsbD0iIzAwN2RmYyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+';
const CIRCLE_RADIUS = 9;

module.exports = {
  CIRCLE_RADIUS, // the blur circle, with which you can drag to set the crop/pixelated region

  HANDLER_COMMON_PROPS: { // all img Handler(<image /> tag in svg), need those common props
    xmlnsXlink: "http://www.w3.org/1999/xlink",
    xlinkHref: CIRCLE_DATA,
    preserveAspectRatio: "none",
    width: CIRCLE_RADIUS * 2, // I can't access the grandparent prop: CIRCLE_RADIUS
    height: CIRCLE_RADIUS * 2, // if radius got changed later, don't forget to update here
  },

  DEF_HANDLER_RECT_WIDTH: 200, // when PixelateHandler get mounted, this is the default width/height
  DEF_HANDLER_RECT_HEIGHT: 200, // if current imgWidth/Height is smaller thant this, use img's w/h instead

  MIN_HANDLER_RECT_WIDTH: 27, // users can set the handler_rec width(by dragging one of the handlers), this is the minimum allowed value
  MIN_HANDLER_RECT_HEIGHT: 27, // if you do want to set the width/height smaller than this, zoom-in first.
};
