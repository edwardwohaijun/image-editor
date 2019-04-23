import React, {Component} from 'react';
import {connect} from "react-redux";
import { bindActionCreators } from 'redux';
import {setPixelateHandlersPosition} from '../../actions'
import {CIRCLE_RADIUS, HANDLER_COMMON_PROPS, DEF_HANDLER_RECT_WIDTH, DEF_HANDLER_RECT_HEIGHT, MIN_HANDLER_RECT_WIDTH, MIN_HANDLER_RECT_HEIGHT} from '../../constants/handler';

class PixelateHandlers extends Component {
  constructor(props) {
    super(props);
    this.state = { selectedHandler: '' };
    this.canvas = document.getElementById('canvas');
    this.canvasWidth = Math.round(props.imgWidth * props.zoomRatio);
    this.canvasHeight = Math.round(props.imgHeight * props.zoomRatio);
    this.svg = null;

// todo: too much "this.handlerX - CIRCLE_RADIUS", do sth to declutter
    // following are props of imgHandlers: an outer rectangle which has the same width/height as the canvas,
    // an inner rectangle which has 4 blue circles as handler, with which you can drag to set the region.
    // The outer rect's position/width/height are fixed, inner rect can be moved/resize.
    this.handlerWidth = Math.min(this.canvasWidth, DEF_HANDLER_RECT_WIDTH); // inner rect's width and height, \
    this.handlerHeight = Math.min(this.canvasHeight, DEF_HANDLER_RECT_HEIGHT); // default value is fixed(read from a constant), unless the canvas' width is less than that
    // to fix: if you set the handlerWidth to the minimum(20px), then scale up, handlerWidth would also get scaled up, then set to 20px again, then scale down to original, \
    // this'd cause handlerWidth less than the minimum allowed 20px, if the scaling factor is bigger enough, even causing negative value

    // the top-left coordinate of inner rect. This coordinate is relative to parent svg, not to browser viewport, \
    // it's also the top-left circle <image />'s center position
    this.handlerX = CIRCLE_RADIUS + (this.canvasWidth - DEF_HANDLER_RECT_WIDTH) / 2; // todo: test this by making a 16px image
    this.handlerY = CIRCLE_RADIUS + (this.canvasHeight - DEF_HANDLER_RECT_HEIGHT) / 2;

    this.handlerMovingX = 0; // when a imgHandler's being dragged, MovingX/Y reflect their real-time position
    this.handlerMovingY = 0;
  }

  setPixelateRegion = () => { // todo: do sth to avoid unnecessary call
    let ratio = this.props.zoomRatio;
    let x = Math.round((this.handlerX - CIRCLE_RADIUS) / ratio);
    let y = Math.round((this.handlerY - CIRCLE_RADIUS) / ratio);
    let width = Math.round(this.handlerWidth / ratio);
    let height = Math.round(this.handlerHeight / ratio);
    this.props.setPixelateHandlersPosition({x, y, width, height});
  };

  noGhosting = evt => evt.preventDefault();
  componentDidMount = () => {
    this.setPixelateRegion();

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

  componentDidUpdate = prevProps => { // after rounding, the final x/y/w/h might exceed boundary, I leave it to Pixelate component to handle
    let resizeRatio = this.props.zoomRatio / prevProps.zoomRatio;
    this.handlerX = Math.round((this.handlerX - CIRCLE_RADIUS) * resizeRatio + CIRCLE_RADIUS); // if we don't do this "-CIRCLE_RADIUS  +CIRCLE_RADIUS", a series of zoom-in/out will accumulate the rounding error, \
    this.handlerY = Math.round((this.handlerY - CIRCLE_RADIUS) * resizeRatio + CIRCLE_RADIUS); // causing handlerX/Y to drift away
    this.handlerWidth = Math.round(this.handlerWidth * resizeRatio);
    this.handlerHeight = Math.round(this.handlerHeight * resizeRatio);
    this.canvasWidth = Math.round(this.canvasWidth * resizeRatio);
    this.canvasHeight = Math.round(this.canvasHeight * resizeRatio);
    this.setPosition();
    this.setPixelateRegion()
  };

  setPosition = () => {
    let xOffset = this.handlerX - CIRCLE_RADIUS;
    let yOffset = this.handlerY - CIRCLE_RADIUS;
    let w = this.handlerWidth;
    let h = this.handlerHeight;

    let imgHandlersXY = [ // x/y position of 4 img handlers
      [xOffset, yOffset], // top-left
      [xOffset + w, yOffset], // top-right
      [xOffset + w, yOffset + h], // bottom-right
      [xOffset, yOffset + h], // bottom-left

      [xOffset + w * 0.5, yOffset], // top-middle
      [xOffset + w, yOffset + h * 0.5], // right-middle
      [xOffset + w * 0.5, yOffset + h], // bottom-middle
      [xOffset, yOffset + h * 0.5], // left-middle
    ];

    let imgHandlers = this.svg.getElementsByTagName('image');
    for(let i = 0; i < imgHandlers.length; i++) {
      imgHandlers[i].setAttribute('x', imgHandlersXY[i][0]);
      imgHandlers[i].setAttribute('y', imgHandlersXY[i][1]);
    }

    let pathEle = this.svg.getElementsByTagName('path')[0];
    let path = composePath(
        {x: CIRCLE_RADIUS, y: CIRCLE_RADIUS, width: this.canvasWidth, height: this.canvasHeight},
        {x: this.handlerX, y: this.handlerY, width: this.handlerWidth, height: this.handlerHeight}
    );
    pathEle.setAttribute('d', path);

    let grabbingEle = this.svg.getElementsByTagName('rect')[0];
    grabbingEle.setAttribute('x', this.handlerX + CIRCLE_RADIUS);
    grabbingEle.setAttribute('y', this.handlerY + CIRCLE_RADIUS);
    grabbingEle.setAttribute('width', this.handlerWidth - CIRCLE_RADIUS * 2);
    grabbingEle.setAttribute('height', this.handlerHeight - CIRCLE_RADIUS * 2)
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

  onMouseUp = evt => {
    if (this.state.selectedHandler) {
      if (this.state.selectedHandler === 'handler-8') {
        evt.target.style.cursor = 'grab'
      }

      this.setState({selectedHandler: ''});
      this.setPixelateRegion();
    }
  };

  onMouseLeave = evt => { // when mouse is dragged out of canvas, released, then move back into canvas,
  // the onMouseUp event is not triggered on svg, thus causing onMouseMove still active.
  // use onMouseLeave to prevent this.
    let rect = this.svg.getElementsByTagName('rect')[0];
    rect.style.cursor = 'grab';

    if (this.state.selectedHandler === '') {
      return // to avoid unnecessary rendering when mouse moving out of canvas
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

    let x2 = this.handlerX; // in case users move the region out of bound or reached the minimum region width/height,
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

      case 8: { // move the region
        this.handlerX += deltaX;
        this.handlerY += deltaY;
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
        {x: CIRCLE_RADIUS, y: CIRCLE_RADIUS, width: this.canvasWidth, height: this.canvasHeight}, // PixelateHandlers is copied from CropHandlers, there are many unused code, like this line,\
        {x: this.handlerX, y: this.handlerY, width: this.handlerWidth, height: this.handlerHeight} // I am too lazy to clean it up
    );

    let path = <path d={pathAttribute} fill='#000' fillOpacity={0.5} strokeWidth={1}/>;
    // todo: make the following svg a component

    let xOffset = this.handlerX - CIRCLE_RADIUS;
    let yOffset = this.handlerY - CIRCLE_RADIUS;
    return (
        <svg id='canvas-handler' ref={s => this.svg = s} style={svgStyle}
             onMouseDown={this.onMouseDown} onMouseUp={this.onMouseUp} onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseLeave}>
          {path}
          <image style={{cursor: 'nwse-resize'}} className='canvas-handler' id="handler-0" x={xOffset} y={yOffset} {...HANDLER_COMMON_PROPS}/>
          <image style={{cursor: 'nesw-resize'}} className='canvas-handler' id="handler-1" x={xOffset + this.handlerWidth} y={yOffset} {...HANDLER_COMMON_PROPS}/>
          <image style={{cursor: 'nwse-resize'}} className='canvas-handler' id="handler-2" x={xOffset + this.handlerWidth} y={yOffset + this.handlerHeight} {...HANDLER_COMMON_PROPS}/>
          <image style={{cursor: 'nesw-resize'}} className='canvas-handler' id="handler-3" x={xOffset} y={yOffset + this.handlerHeight} {...HANDLER_COMMON_PROPS}/>

          {/*
          rect's starting X/Y are bigger, width/height are smaller than the underlying innerRect for easy grab,
          otherwise, the grab cursor overlap the resize cursor when the mouse is over one of resize handlers.
          Set the rect's fill to 'yellow', fillOpacity = 0.4, and you'd see what I mean.
          */}
          <rect x={xOffset + CIRCLE_RADIUS * 2} y={yOffset + CIRCLE_RADIUS * 2} width={this.handlerWidth - CIRCLE_RADIUS * 2} height={this.handlerHeight - CIRCLE_RADIUS * 2}
                className='canvas-handler' id='handler-8' fillOpacity={0} cursor='grab'/>

          <image style={{cursor: 'ns-resize'}} className='canvas-handler' id="handler-4" x={xOffset + this.handlerWidth * 0.5} y={yOffset} {...HANDLER_COMMON_PROPS}/>
          <image style={{cursor: 'ew-resize'}} className='canvas-handler' id="handler-5" x={xOffset + this.handlerWidth} y={yOffset + this.handlerHeight * 0.5} {...HANDLER_COMMON_PROPS}/>
          <image style={{cursor: 'ns-resize'}} className='canvas-handler' id="handler-6" x={xOffset + this.handlerWidth * 0.5} y={yOffset + this.handlerHeight} {...HANDLER_COMMON_PROPS}/>
          <image style={{cursor: 'ew-resize'}} className='canvas-handler' id="handler-7" x={xOffset} y={yOffset + this.handlerHeight * 0.5} {...HANDLER_COMMON_PROPS}/>
        </svg>
    )}
}


const mapStateToProps = state => ({
  imgWidth: state.imgStat.get('width'),
  imgHeight: state.imgStat.get('height'),
});
const mapDispatchToProps = dispatch => bindActionCreators({setPixelateHandlersPosition}, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(PixelateHandlers);

const composePath = (outer, inner) => {
  let outerRect = 'M' + outer.x + ',' + outer.y + ' h' + outer.width + ' v' + outer.height + ' h-' + outer.width + ' z';
  let innerRect = 'M' + inner.x + ','  + inner.y + ' v' + inner.height + ' h' + inner.width + ' v-' + inner.height + ' z';
  return outerRect + innerRect
};
