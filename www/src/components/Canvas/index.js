import {Image} from "image-editor/image_editor";
import imgObj from '../common/imgObj';
import React, {Component} from 'react';
import { bindActionCreators } from 'redux';
import {setZoomRatio} from '../../actions'
import { connect } from 'react-redux';
import CropHandlers from './CropHandlers'
//import ScaleHandlers from './ScaleHandlers'

// todo: make bottom: 44px a constant, it's the height of footer, do the same for header
class Canvas extends Component {
  constructor(props) {
    super(props);
    this.canvas = null;
    this.ctx = null;
    this.canvasContainer = null;
    this.state = {
    };
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
    return (
        <div ref={div => this.canvasContainer = div} className='scrollbar' id='canvas-container'
             style={{width: '100%', position: 'absolute', bottom: '44px', top: 0, backgroundColor: '#1e2025'}}>
          <canvas id='canvas' ref={canvas => this.canvas = canvas} style={{position: 'absolute', margin: '20px'}} />
          {/* canvas must have a margin of 20px(larger than imgHandler radius is enough, otherwise the upper part of imgHandler of large canvas will be "cut off" */}
          {
            this.props.cropHandlersVisible ? <CropHandlers zoomRatio={this.props.zoomRatio}/> : null
          }
          {/* this.props.scaleHandlersVisible ? <ScaleHandlers zoomRatio={this.props.zoomRatio}/> : null */}
        </div>
    )}
}

const mapStateToProps = state => (
    {
      zoomRatio: state.imgStat.get('zoomRatio'),
      cropHandlersVisible: state.cropHandlersVisible,
      //scaleHandlersVisible: state.scaleHandlersVisible
    }
);
const mapDispatchToProps = dispatch => bindActionCreators({setZoomRatio},dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Canvas);
