import imgObj from '../common/imgObj';
import React, {Component} from 'react';

// todo: drag的时候, 最好svg周围标上: 当前的width/height, scale up/down, 最好也如此设置.
// or at lease show these data on left pane.
const circleImg = 'data:image/svg+xml;base64,PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxOHB4IiBoZWlnaHQ9IjE4cHgiIHZlcnNpb249IjEuMSI+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjUiIHN0cm9rZT0iI2ZmZiIgZmlsbD0iIzAwN2RmYyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+';
const handlerCommonProps = {
  xmlnsXlink: "http://www.w3.org/1999/xlink",
  xlinkHref: circleImg,
  preserveAspectRatio: "none",
  width: '18',
  height: '18',
};

export default class ScaleHandlers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedHandler: '',
    };

    this.wasm_img = imgObj.get_wasm_img();
    this.scaleRegionInfo = null;

    this.canvas = document.getElementById('canvas');
    this.canvasWidth = this.canvas.width;
    this.canvasHeight = this.canvas.height;
    this.canvasBbox = this.canvas.getBoundingClientRect(); // canvas element already loaded when canvasHandler is loaded
    this.hwRatio = this.canvasWidth / this.canvasHeight; // height/width ratio
    this.svg = null;

    // following are props of imgHandlers: an outer rectangle which has the same width/height as the canvas,
    // an inner rectangle which has 4 blue circles as handler, with which you can drag to set the scale region.
    // The outer rect's position/width/height are fixed, inner rect can be moved/resize.
    this.handlerX = 9; // the top-left coordinate of inner rect. This coordinate is relative to parent svg, not to browser viewport
    this.handlerY = 9; // 9 is the imgHandler's radius, this value make 4 imgHandler's center sit right on the corner of the underlying canvas
    this.handlerWidth = this.canvasBbox.width; // inner rect's width and height
    this.handlerHeight = this.canvasBbox.height; // the default value is the same as the underlying canvas
    this.handlerMovingX = 0; // when a imgHandler's being dragged, MovingX/Y reflect their real-time position
    this.handlerMovingY = 0;
  }

  setScaleRegionInfo = readOriginal => {
    // handlerWidth/Height is zoomRatio applied, we need to get the original w/h by dividing them by ratio,
    // but: width * ratio / ratio !== width, there are some rounding error.
    // When this component get mounted, handlerWidth/Height are the same as original image's w/h, thus, read directly from wasm_img.
    let regionInfoEle = this.scaleRegionInfo.getElementsByClassName('canvas-handler-region-info');
    let w = regionInfoEle[0];
    let h = regionInfoEle[1];
    let ratio = regionInfoEle[2];
    if (readOriginal) {
      w.innerText = this.wasm_img.width() + ' px';
      h.innerText = this.wasm_img.height() + ' px';
      ratio.innerText = '100 %';
      return
    }

    let zoomRatio = this.props.zoomRatio;
    w.innerText = Math.round(this.handlerWidth / zoomRatio) + ' px';
    h.innerText = Math.round(this.handlerHeight / zoomRatio) + ' px';
    // console.log('handlerW/canvasW: ', this.handlerWidth, '/', this.canvasWidth);
    // todo: 还需要有个hidden field专门存放原始的float值.
    ratio.innerText = (this.handlerWidth / this.canvasWidth).toFixed(2) * 100 + ' %';
  };

  componentDidMount = () => {
    this.scaleRegionInfo = document.getElementById('scale-region-info');
    this.setScaleRegionInfo(true)
  };

  componentDidUpdate = prevProps => { // todo: after rounding, the final x/y/w/h might exceed boundary
    let resizeRatio = this.props.zoomRatio / prevProps.zoomRatio;
    this.handlerX = Math.round((this.handlerX - 9) * resizeRatio + 9); // if we don't do this "-9  + 9", a series of zoom-in/out will accumulate the rounding error, \
    this.handlerY = Math.round((this.handlerY - 9) * resizeRatio + 9); // causing handlerX/Y to drift away
    this.handlerWidth = Math.round(this.handlerWidth * resizeRatio);
    this.handlerHeight = Math.round(this.handlerHeight * resizeRatio);
    this.canvasWidth = Math.round(this.canvasWidth * resizeRatio);
    this.canvasHeight = Math.round(this.canvasHeight * resizeRatio);

    this.setPosition()
  };

  // todo: 确保 handlerX, Y的最小值是0, 用 min()
  // when new zoomRatio is applied, set handlers position
  setPosition = () => { // do I really need those ugly '-9' ???
    let imgHandlersXY = [ // x/y position of 4 img handlers
      [this.handlerX - 9, this.handlerY - 9], // top-left
    ];

    let imgHandlers = this.svg.getElementsByTagName('image');
    for(let i = 0; i < imgHandlers.length; i++) {
      imgHandlers[i].setAttribute('x', imgHandlersXY[i][0]);
      imgHandlers[i].setAttribute('y', imgHandlersXY[i][1]);
    }

    let pathEle = this.svg.getElementsByTagName('path')[0];
    let path = composePath(
        {x: 9, y: 9, width: this.canvasWidth, height: this.canvasHeight},
        {x: this.handlerX, y: this.handlerY, width: this.handlerWidth, height: this.handlerHeight}
    );
    pathEle.setAttribute('d', path);
  };

  onMouseDown = evt => {
    if (!evt.target.classList.contains('canvas-handler')) {
      return
    }

    this.handlerMovingX = evt.clientX;
    this.handlerMovingY = evt.clientY;
    this.setState({
      selectedHandler: evt.target.id
    });
  };

  onMouseUp = evt => { // todo: check 一下, 是否有 9px 之类的offset需要考虑.
    if (this.state.selectedHandler) {
      this.setState({selectedHandler: ''});
    }
  };

  onMouseLeave = evt => { // when mouse is dragged out of canvas, released, then move back into canvas,
  // the onMouseUp event is not triggered on svg, thus causing onMouseMove still active.
  // use onMouseLeave to prevent this.
    this.setState({
      selectedHandler: ''
    });
  };

  onMouseMove = evt => {
    if (!this.state.selectedHandler) {
      return
    }

    let x = evt.clientX, y = evt.clientY;
    let deltaX = x - this.handlerMovingX;
    let deltaY = Math.round(this.hwRatio * deltaX);

    // todo: remove these 4 items
    let x2 = this.handlerX; // in case users move the scale region out of bound,
    let y2 = this.handlerY; // we need to restore the original value.
    let w = this.handlerWidth;
    let h = this.handlerHeight;

    let handlerID = parseInt(this.state.selectedHandler.split('-')[1]);
    switch (handlerID) {
      case 0: { // top-left handler
        this.handlerX += deltaX;
        this.handlerY += deltaY;
        this.handlerWidth -= deltaX;
        this.handlerHeight -= deltaY;
        break;
      }
    }

    // out of canvas bound
    if (this.handlerX - 9 + this.handlerWidth > this.canvasWidth
    || this.handlerX - 9 < 0
    || this.handlerY - 9 + this.handlerHeight > this.canvasHeight
    || this.handlerY - 9 < 0) {
      this.handlerX = x2;
      this.handlerY = y2;
      this.handlerWidth = w;
      this.handlerHeight = h;
      return
    }

    this.handlerMovingX = x;
    this.handlerMovingY = y;
    this.setScaleRegionInfo(false);
    this.setPosition()
  };

  render() {
    let width = this.canvasBbox.width;
    let height = this.canvasBbox.height;

    let canvasLeft = this.canvas.style.left;
    let canvasTop = this.canvas.style.top;
    let svgStyle = {
      position: 'absolute',
      left: (parseInt(canvasLeft) - 9 + 20) + 'px', // 9 is imgHandler radius, 20 is canvasElement's margin
      top: (parseInt(canvasTop) - 9 + 20) + 'px',
      width: width + 18, // 18 is imgHandler diameter
      height: height + 18,
    };

    let pathAttribute = composePath( // when canvasHandler get mounted, its outerRect and innerRect are the same
        {x: 9, y: 9, width, height},
        {x: 9, y: 9, width, height}
    );

    //let path = <path d={pathAttribute} fill='#000' fillOpacity={0.6} strokeWidth={1} stroke='#CCC' strokeDasharray='4 2'/>;
    return (
        <svg id='canvas-handler' ref={s => this.svg = s} style={svgStyle}
             onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave}>
          <pattern id="svg-checkerboard-pattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse" >
            <rect fill="#ccc" x="0" y="0" width="12" height="12" />
            <rect fill="#ccc" x="12" y="12" width="12" height="12" />
            <rect fill="#FFF" x="12" width="12" height="12" y="0" />
            <rect fill="#FFF" x="0" width="12" height="12" y="12" />
          </pattern>
          <rect fill="url(#pattern)" x="0" y="0" width="100%" height="100%"/>
          {/* todo: animate the path, like: https://css-tricks.com/svg-line-animation-works/ */}
          {/* path */}
          <path d={pathAttribute} fill='url(#svg-checkerboard-pattern' strokeWidth={1} stroke='#CCC'/>
          <image style={{cursor: 'nwse-resize'}} className='canvas-handler' id="handler-0" x={0} y={0} {...handlerCommonProps}/>
        </svg>
    )}
}

const composePath = (outer, inner) => {
  let outerRect = 'M' + outer.x + ',' + outer.y + ' h' + outer.width + ' v' + outer.height + ' h-' + outer.width + ' z';
  let innerRect = 'M' + inner.x + ','  + inner.y + ' v' + inner.height + ' h' + inner.width + ' v-' + inner.height + ' z';
  return outerRect + innerRect
};
