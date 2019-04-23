import React, {Component} from 'react';
import {connect} from "react-redux";

const circleImg = 'data:image/svg+xml;base64,PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIxOHB4IiBoZWlnaHQ9IjE4cHgiIHZlcnNpb249IjEuMSI+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjUiIHN0cm9rZT0iI2ZmZiIgZmlsbD0iIzAwN2RmYyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+';
const handlerCommonProps = {
  xmlnsXlink: "http://www.w3.org/1999/xlink",
  xlinkHref: circleImg,
  preserveAspectRatio: "none",
  width: '18',
  height: '18',
};

class CropHandlers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedHandler: '',
    };

    this.cropRegionInfo = null;

    this.canvas = document.getElementById('canvas');
    this.canvasWidth = Math.round(props.imgWidth * props.zoomRatio); // this.canvas.width;
    this.canvasHeight = Math.round(props.imgHeight * props.zoomRatio); // this.canvas.height;
    this.canvasBbox = this.canvas.getBoundingClientRect(); // canvas element already loaded when canvasHandler is loaded
    this.svg = null;

    // following are props of imgHandlers: an outer rectangle which has the same width/height as the canvas,
    // an inner rectangle which has 4 blue circles as handler, with which you can drag to set the crop region.
    // The outer rect's position/width/height are fixed, inner rect can be moved/resize.
    this.handlerX = 9; // the top-left coordinate of inner rect. This coordinate is relative to parent svg, not to browser viewport
    this.handlerY = 9; // 9 is the imgHandler's radius, this value make 4 imgHandler's center sit right on the corner of the underlying canvas
    this.handlerWidth = this.canvasWidth; // this.canvasBbox.width; // inner rect's width and height
    this.handlerHeight = this.canvasHeight; // this.canvasBbox.height; // the default value is the same as the underlying canvas
    this.handlerMovingX = 0; // when a imgHandler's being dragged, MovingX/Y reflect their real-time position
    this.handlerMovingY = 0;
  }

  setCropRegionInfo = () => {
    // handlerWidth/Height is zoomRatio applied, we need to get the original w/h by dividing them by ratio,
    // but: width * ratio / ratio !== width, there are some rounding error.
    // When this component get mounted, handlerWidth/Height are the same as original image's w/h, thus, read directly from wasm_img.
    let regionInfoEle = this.cropRegionInfo.getElementsByClassName('canvas-handler-region-info');
    let w = regionInfoEle[0];
    let h = regionInfoEle[1];
    let x = regionInfoEle[2];
    let y = regionInfoEle[3];

    let ratio = this.props.zoomRatio;
    w.innerText = Math.round(this.handlerWidth / ratio) + ' px';
    h.innerText = Math.round(this.handlerHeight / ratio) + ' px';
    x.innerText = Math.round((this.handlerX - 9) / ratio);
    y.innerText = Math.round((this.handlerY - 9) / ratio);
  };

  // there are 8 small blue dot img handlers for users to click and drag,\
  // without this fn, dragging will create a ghost image,\
  // Chrome don't have ghosting, but FF does
  // many solutions exist, https://stackoverflow.com/questions/7439042/css-js-to-prevent-dragging-of-ghost-image
  noGhosting = evt => evt.preventDefault();

  componentDidMount = () => {
    this.cropRegionInfo = document.getElementById('crop-region-info');

    let imgHandlers = this.svg.getElementsByTagName('image');
    for(let i = 0; i < imgHandlers.length; i++) {
      imgHandlers[i].addEventListener('mousedown', this.noGhosting)
    }
  };

  componentWillUnmount = () => {
    let imgHandlers = this.svg.getElementsByTagName('image');
    for(let i = 0; i < imgHandlers.length; i++) {
      imgHandlers[i].removeEventListener('mousedown', this.noGhosting)
    }
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
  setPosition = () => { // do I really need those ugly '-9' ???
     let imgHandlersXY = [ // x/y position of 4 img handlers
      [this.handlerX - 9, this.handlerY - 9], // top-left
      [this.handlerX - 9 + this.handlerWidth, this.handlerY - 9], // top-right
      [this.handlerX - 9 + this.handlerWidth, this.handlerY - 9 + this.handlerHeight], // bottom-right
      [this.handlerX - 9, this.handlerY - 9 + this.handlerHeight], // bottom-left

      [this.handlerX - 9 + this.handlerWidth * 0.5, this.handlerY - 9], // top-middle
      [this.handlerX - 9 + this.handlerWidth, this.handlerY - 9 + this.handlerHeight * 0.5], // right-middle
      [this.handlerX - 9 + this.handlerWidth * 0.5, this.handlerY - 9 + this.handlerHeight], // bottom-middle
      [this.handlerX - 9, this.handlerY - 9 + this.handlerHeight * 0.5], // left-middle
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

    let grabbingEle = this.svg.getElementsByTagName('rect')[0];
    grabbingEle.setAttribute('x', this.handlerX + 9);
    grabbingEle.setAttribute('y', this.handlerY + 9);
    grabbingEle.setAttribute('width', this.handlerWidth - 18);
    grabbingEle.setAttribute('height', this.handlerHeight - 18)
  };

  onMouseDown = evt => {
    if (!evt.target.classList.contains('canvas-handler')) {
      return
    }

    if (evt.target.id === 'handler-8') {
      evt.target.style.cursor = 'grabbing'
    }

    this.handlerMovingX = evt.clientX;
    this.handlerMovingY = evt.clientY;
    this.setState({
      selectedHandler: evt.target.id
    });
  };

  onMouseUp = evt => { // todo: check 一下, 是否有 9px 之类的offset需要考虑.
    if (this.state.selectedHandler) {
      if (this.state.selectedHandler === 'handler-8') {
        evt.target.style.cursor = 'grab'
      }

      this.setState({selectedHandler: ''});
    }
  };

  onMouseLeave = evt => { // when mouse is dragged out of canvas, released, then move back into canvas,
  // the onMouseUp event is not triggered on svg, thus causing onMouseMove still active.
  // use onMouseLeave to prevent this.
    let rect = this.svg.getElementsByTagName('rect')[0];
    rect.style.cursor = 'grab';

    if (this.state.selectedHandler === '') {
      return
    }

    this.setState({selectedHandler: ''});
  };

  onMouseMove = evt => {
    if (!this.state.selectedHandler) {
      return
    }

    let x = evt.clientX, y = evt.clientY;
    let deltaX = x - this.handlerMovingX;
    let deltaY = y - this.handlerMovingY;

    let x2 = this.handlerX; // in case users move the crop region out of bound,
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
      case 1: { // top-right handler
        this.handlerY += deltaY;
        this.handlerWidth += deltaX;
        this.handlerHeight -= deltaY;
        break;
      }
      case 2: { // bottom-right handler
        this.handlerWidth += deltaX;
        this.handlerHeight += deltaY;
        break;
      }
      case 3: { // bottom-left handler
        this.handlerX += deltaX;
        this.handlerWidth -= deltaX;
        this.handlerHeight += deltaY;
        break;
      }

      case 4: { // top-middle
        this.handlerY += deltaY;
        this.handlerHeight -= deltaY;
        break;
      }
      case 5: { // right-middle
        this.handlerWidth += deltaX;
        break;
      }
      case 6: { // bottom-middle
        this.handlerHeight += deltaY;
        break;
      }
      case 7: { // left-middle
        this.handlerX += deltaX;
        this.handlerWidth -= deltaX;
        break;
      }

      case 8: { // move the crop-region
        this.handlerX += deltaX;
        this.handlerY += deltaY;
        break;
      }
    }

    // out of canvas bound
    if (this.handlerX - 9 + this.handlerWidth > this.canvasWidth
    || this.handlerX - 9 < 0
    || this.handlerY - 9 + this.handlerHeight > this.canvasHeight
    || this.handlerY - 9 < 0
    || this.handlerWidth < 20 // width/height has reached the minimum value. If the img's width <= 20px, you can zoom-in, then set width/height
    || this.handlerHeight < 20) // todo: make 20 a constant
    {
      this.handlerX = x2;
      this.handlerY = y2;
      this.handlerWidth = w;
      this.handlerHeight = h;
      return
    }

    this.handlerMovingX = x;
    this.handlerMovingY = y;
    this.setCropRegionInfo();
    this.setPosition()
  };

  render() {
    let width = this.handlerWidth; // this.canvasBbox.width;
    let height = this.handlerHeight; // this.canvasBbox.height;

    let canvasLeft = this.canvas.style.left;
    let canvasTop = this.canvas.style.top;
    let svgStyle = {
      position: 'absolute',
      left: (parseInt(canvasLeft) - 9 + 20) + 'px', // 9 is imgHandler radius, 20 is canvasElement's margin
      top: (parseInt(canvasTop) - 9 + 20) + 'px',
      width: this.canvasWidth + 18, // 18 is imgHandler diameter
      height: this.canvasHeight + 18,
    };

    let pathAttribute = composePath( // when canvasHandler get mounted, its outerRect and innerRect are the same
        {x: 9, y: 9, width, height},
        {x: 9, y: 9, width: this.canvasWidth, height: this.canvasHeight}
    );

    let path = <path d={pathAttribute} fill='#000' fillOpacity={0.6} strokeWidth={1}/>;
    return (
        <svg id='canvas-handler' ref={s => this.svg = s} style={svgStyle}
             onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave}>
          {path}
          <image style={{cursor: 'nwse-resize'}} className='canvas-handler' id="handler-0" x={0} y={0} {...handlerCommonProps}/>
          <image style={{cursor: 'nesw-resize'}} className='canvas-handler' id="handler-1" x={width} y={0} {...handlerCommonProps}/>
          <image style={{cursor: 'nwse-resize'}} className='canvas-handler' id="handler-2" x={width} y={height} {...handlerCommonProps}/>
          <image style={{cursor: 'nesw-resize'}} className='canvas-handler' id="handler-3" x={0} y={height} {...handlerCommonProps}/>

          {/*
          rect's starting X/Y are bigger, width/height are smaller than the underlying innerRect for easy grab,
          otherwise, the grab cursor overlap the resize cursor when the mouse is over one of resize handlers.
          set the rect's fill to 'yellow', fillOpacity = 0.4, and you'd see what I mean.
          */}
          <rect x={9 + 9} y={9 + 9} width={width - 18} height={height - 18} className='canvas-handler' id='handler-8' fillOpacity={0} cursor='grab'/>

          <image style={{cursor: 'ns-resize'}} className='canvas-handler' id="handler-4" x={width * 0.5} y={0} {...handlerCommonProps}/>
          <image style={{cursor: 'ew-resize'}} className='canvas-handler' id="handler-5" x={width} y={height * 0.5} {...handlerCommonProps}/>
          <image style={{cursor: 'ns-resize'}} className='canvas-handler' id="handler-6" x={width * 0.5} y={height} {...handlerCommonProps}/>
          <image style={{cursor: 'ew-resize'}} className='canvas-handler' id="handler-7" x={0} y={height * 0.5} {...handlerCommonProps}/>
        </svg>
    )}
}


const mapStateToProps = state => ({
  imgWidth: state.imgStat.get('width'),
  imgHeight: state.imgStat.get('height'),
});
// const mapDispatchToProps = dispatch => bindActionCreators({setWidthHeight}, dispatch);
export default connect(mapStateToProps, null)(CropHandlers);


const composePath = (outer, inner) => {
  let outerRect = 'M' + outer.x + ',' + outer.y + ' h' + outer.width + ' v' + outer.height + ' h-' + outer.width + ' z';
  let innerRect = 'M' + inner.x + ','  + inner.y + ' v' + inner.height + ' h' + inner.width + ' v-' + inner.height + ' z';
  return outerRect + innerRect
};
