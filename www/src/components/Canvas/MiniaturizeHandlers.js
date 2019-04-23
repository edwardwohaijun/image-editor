import React, {Component} from 'react';
import {connect} from "react-redux";
import { bindActionCreators } from 'redux';
import {setMiniHeights} from '../../actions'
import {CIRCLE_RADIUS, HANDLER_COMMON_PROPS, MIN_HANDLER_RECT_WIDTH, MIN_HANDLER_RECT_HEIGHT} from '../../constants/handler';

class MiniHandlers extends Component { // it should be named "MiniaturizeHandler", but too wordy
  constructor(props) {
    super(props);
    this.state = { selectedHandler: '' };
    this.canvas = document.getElementById('canvas');
    this.canvasWidth = Math.round(props.imgWidth * props.zoomRatio);
    this.canvasHeight = Math.round(props.imgHeight * props.zoomRatio);
    this.svg = null;

    // following are props of imgHandlers: an outer rectangle which has the same width/height as the canvas,
    // an inner rectangle which has 4 blue circles as handler, with which you can drag to set the region.
    // The outer rect's position/width/height are fixed, inner rect can be moved/resize.
    // this.handlerWidth = Math.min(this.canvasWidth, DEF_HANDLER_RECT_WIDTH); // inner rect's width and height, \
    this.handlerWidth = this.canvasWidth;
    this.handlerHeight = this.canvasHeight / 3;
    // this.handlerHeight = Math.min(this.canvasHeight, DEF_HANDLER_RECT_HEIGHT); // default value is fixed(read from a constant), unless the canvas' width is less than that
    // to fix: if you set the handlerWidth to the minimum(20px), then scale up, handlerWidth would also get scaled up, then set to 20px again, then scale down to original, \
    // this'd cause handlerWidth less than the minimum allowed 20px, if the scaling factor is bigger enough, even causing negative value

    // the top-left coordinate of inner rect. This coordinate is relative to parent svg, not to browser viewport, \
    // it's also the top-left circle <image />'s center position
    // this.handlerX = CIRCLE_RADIUS + (this.canvasWidth - DEF_HANDLER_RECT_WIDTH) / 2; // todo: test this by making a 16px image
    this.handlerX = CIRCLE_RADIUS;
    // this.handlerY = CIRCLE_RADIUS + (this.canvasHeight - DEF_HANDLER_RECT_HEIGHT) / 2;
    this.handlerY = CIRCLE_RADIUS + this.canvasHeight / 3;

    this.handlerMovingX = 0; // when a imgHandler's being dragged, MovingX/Y reflect their real-time position
    this.handlerMovingY = 0;
  }

  setMiniRegion = () => {
    let ratio = this.props.zoomRatio;
    let y = Math.round((this.handlerY - CIRCLE_RADIUS) / ratio);
    let height = Math.round(this.handlerHeight / ratio);
    this.props.setMiniHeights({top: y, bottom: this.props.imgHeight - (y + height)});
  };

  noGhosting = evt => evt.preventDefault();
  componentDidMount = () => {
    this.setMiniRegion();

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

  componentDidUpdate = prevProps => {
    let resizeRatio = this.props.zoomRatio / prevProps.zoomRatio;
    this.handlerX = Math.round((this.handlerX - CIRCLE_RADIUS) * resizeRatio + CIRCLE_RADIUS); // if we don't do this "-CIRCLE_RADIUS  +CIRCLE_RADIUS", a series of zoom-in/out will accumulate the rounding error, \
    this.handlerY = Math.round((this.handlerY - CIRCLE_RADIUS) * resizeRatio + CIRCLE_RADIUS); // causing handlerX/Y to drift away
    this.handlerWidth = Math.round(this.handlerWidth * resizeRatio);
    this.handlerHeight = Math.round(this.handlerHeight * resizeRatio);
    this.canvasWidth = Math.round(this.canvasWidth * resizeRatio);
    this.canvasHeight = Math.round(this.canvasHeight * resizeRatio);
    this.setPosition();
    this.setMiniRegion()
  };

  setPosition = () => {
    let xOffset = this.handlerX - CIRCLE_RADIUS;
    let yOffset = this.handlerY - CIRCLE_RADIUS;
    let w = this.handlerWidth;
    let h = this.handlerHeight;

    let imgHandlersXY = [ // x/y position of 2 img handlers
      [xOffset + w * 0.5, yOffset], // top-middle
      [xOffset + w * 0.5, yOffset + h], // bottom-middle
    ];

    let imgHandlers = this.svg.getElementsByTagName('image');
    for(let i = 0; i < imgHandlers.length; i++) {
      imgHandlers[i].setAttribute('x', imgHandlersXY[i][0]);
      imgHandlers[i].setAttribute('y', imgHandlersXY[i][1]);
    }

    let pathEle = this.svg.getElementsByTagName('path')[0];
    let path = composePath(
        // {x: CIRCLE_RADIUS, y: CIRCLE_RADIUS, width: this.canvasWidth, height: this.canvasHeight},
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

  onMouseUp = evt => {
    if (this.state.selectedHandler) {
      this.setState({selectedHandler: ''});
      this.setMiniRegion();
    }
  };

  onMouseLeave = evt => {
    if (this.state.selectedHandler === '') {
      return // to avoid unnecessary rendering when mouse moving out of canvas
    }
    this.setState({selectedHandler: ''});
  };

  // todo: make sure bellow part can't exceed top part, and vice versa
  onMouseMove = evt => {
    if (!this.state.selectedHandler) {
      return
    }

    let x = evt.clientX, y = evt.clientY;
    //let deltaX = x - this.handlerMovingX;
    let deltaY = y - this.handlerMovingY;

    let x2 = this.handlerX; // in case users move the region out of bound or reached the minimum region width/height,
    let y2 = this.handlerY; // we need to restore the original value.
    let w = this.handlerWidth;
    let h = this.handlerHeight;

    let handlerID = parseInt(this.state.selectedHandler.split('-')[1]);
    switch (handlerID) {
      case 4: { // top-middle
        this.handlerY += deltaY;
        this.handlerHeight -= deltaY;
        break;
      }
      case 6: { // bottom-middle
        this.handlerHeight += deltaY;
        break;
      }
    }

    // out of canvas bound
    if (this.handlerX - CIRCLE_RADIUS + this.handlerWidth > this.canvasWidth
    || this.handlerX - CIRCLE_RADIUS < 0
    || this.handlerY - CIRCLE_RADIUS + this.handlerHeight > this.canvasHeight
    || this.handlerY - CIRCLE_RADIUS < 0
    || this.handlerWidth < MIN_HANDLER_RECT_WIDTH // width/height has reached the minimum value.
    || this.handlerHeight < MIN_HANDLER_RECT_HEIGHT) // If the img's width/height is by nature less than 20px, you need to zoom-in, then set width/height
    {
      this.handlerX = x2;
      this.handlerY = y2;
      this.handlerWidth = w;
      this.handlerHeight = h;
      return
    }

    this.handlerMovingX = x;
    this.handlerMovingY = y;
    this.setPosition();
  };

  // handler is represented as a dot img, this fn is to prevent the underlying img from capturing the mouseDown when dragging,\
  // in Firefox, when the dot img is being dragged, the drag would create a ghost of image, Chrome don't have this phenomenon
  onHandlerDown = evt => evt.preventDefault();

  render() {
    let canvasLeft = this.canvas.style.left;
    let canvasTop = this.canvas.style.top;
    let svgStyle = {
      position: 'absolute',
      left: (parseInt(canvasLeft) - CIRCLE_RADIUS + 20) + 'px', // 20 is canvasElement's margin(todo: make this 20 a constant)
      top: (parseInt(canvasTop) - CIRCLE_RADIUS + 20) + 'px',
      width: this.canvasWidth + CIRCLE_RADIUS * 2,
      height: this.canvasHeight + CIRCLE_RADIUS * 2,
    };

    let pathAttribute = composePath(
        // {x: CIRCLE_RADIUS, y: CIRCLE_RADIUS, width: this.canvasWidth, height: this.canvasHeight}, // this handlers is copied from PixelateHandlers, there are many unused code, like this line,\
        {x: this.handlerX, y: this.handlerY, width: this.handlerWidth, height: this.handlerHeight} // I am too lazy to clean it up
    );
    let path = <path d={pathAttribute} fill='none' stroke='#ccc' strokeWidth={2} strokeDasharray="5,5"/>;

    let xOffset = this.handlerX - CIRCLE_RADIUS;
    let yOffset = this.handlerY - CIRCLE_RADIUS;
    return (
        <svg id='canvas-handler' ref={s => this.svg = s} style={svgStyle}
             onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave}>
          {path}
          <image style={{cursor: 'ns-resize'}} className='canvas-handler' id="handler-4" x={xOffset + this.handlerWidth * 0.5} y={yOffset} {...HANDLER_COMMON_PROPS}/>
          <image style={{cursor: 'ns-resize'}} className='canvas-handler' id="handler-6" x={xOffset + this.handlerWidth * 0.5} y={yOffset + this.handlerHeight} {...HANDLER_COMMON_PROPS}/>
        </svg>
    )}
}

const mapStateToProps = state => ({
  imgWidth: state.imgStat.get('width'),
  imgHeight: state.imgStat.get('height'),
});
const mapDispatchToProps = dispatch => bindActionCreators({setMiniHeights}, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(MiniHandlers);

const composePath = (inner) => {
  // let outerRect = 'M' + outer.x + ',' + outer.y + ' h' + outer.width + ' v' + outer.height + ' h-' + outer.width + ' z';
  let innerRect = 'M' + inner.x + ','  + inner.y + ' v' + inner.height + ' h' + inner.width + ' v-' + inner.height + ' z';
  return innerRect
};
