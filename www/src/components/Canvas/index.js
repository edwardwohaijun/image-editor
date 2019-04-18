import imgObj from '../common/imgObj';
import React, {Component} from 'react';
import { bindActionCreators } from 'redux';
import {setZoomRatio} from '../../actions'
import { connect } from 'react-redux';
import CropHandlers from './CropHandlers'
import PixelateHandlers from './PixelateHandlers';
import MiniHandlers from './MiniaturizeHandlers';

// todo: make bottom: 44px a constant, it's the height of footer, do the same for header
class Canvas extends Component {
  constructor(props) {
    super(props);
    this.canvas = null;
    this.ctx = null;
    this.state = { };
  }

  componentDidUpdate = prevProps => {
    if (this.props.zoomRatio === 0) {
      return
    }

    if (this.props.zoomRatio !== prevProps.zoomRatio) { // zoom-in/out button clicked
      this.props.resizeCanvas(false);
      this.ctx.drawImage(imgObj.imgBuff, 0, 0);
    }
  };

  componentDidMount = () => {
    this.ctx = this.canvas.getContext('2d');
    this.props.loadImage();
  };

  render() {
    // width: "calc(100vw - 76px)", - 56 - 20. 56: left-most vertical toolbar width, 20: leave white space between canvas and right most border
    return (
        <div className='scrollbar' id='canvas-container'
             style={{width: this.props.containerWidth, position: 'absolute', bottom: '44px', top: 0, backgroundColor: '#1e2025'}}>
          <canvas id='canvas' ref={canvas => this.canvas = canvas} style={{position: 'absolute', margin: '20px'}} />
          {/*<canvas id='canvas' ref={canvas => this.canvas = canvas} style={{position: 'absolute'}} />*/}
          {/* canvas must have a margin of 20px(larger than imgHandler radius is enough, otherwise the upper part of imgHandler of large canvas will be "cut off" */}

          {/* if new handlers are to be created, don't forget to update fn resizeCanvas() in Main */}
          { this.props.cropHandlersVisible ? <CropHandlers zoomRatio={this.props.zoomRatio}/> : null }
          { this.props.pixelateHandlersVisible ? <PixelateHandlers zoomRatio={this.props.zoomRatio}/> : null }
          { this.props.miniHandlersVisible ? <MiniHandlers zoomRatio={this.props.zoomRatio}/> : null }
          {/* todo: I just copy and paste to create the <PixelateHandlers />, consider refactoring them into a <Handler /> */}
        </div>
    )}
}

const mapStateToProps = state => (
    {
      zoomRatio: state.imgStat.get('zoomRatio'),
      cropHandlersVisible: state.cropHandlersVisible,
      pixelateHandlersVisible: state.pixelateHandlers.get('visible'),
      miniHandlersVisible: state.miniHandlers.get('visible'),
    }
);
const mapDispatchToProps = dispatch => bindActionCreators({setZoomRatio},dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Canvas);
