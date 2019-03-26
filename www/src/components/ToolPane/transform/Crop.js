// flip-h/v, rotate 90/180(other degrees to be add later), shrea
// scale up/down
import imgObj from '../../common/imgObj'
import React, {Component} from 'react';

export default class Crop extends Component {
  constructor(props) {
    super(props);
    this.imgObj = imgObj.getImgObj();
    this.imgWidth = this.imgObj.width();
    this.imgHeight = this.imgObj.height();

    this.cropRegion = null;
    this.state = {
    }
  }

  componentDidMount = () => this.props.showCropHandlers(true);
  componentWillUnmount = () => this.props.showCropHandlers(false);

  onApply = evt => { // todo: parse 4 values to integer before passing to crop();
    let regionInfoEle = this.cropRegion.getElementsByClassName('canvas-handler-region-info');
    let w = parseInt(regionInfoEle[0].innerText); // only block element support innerText, like div
    let h = parseInt(regionInfoEle[1].innerText);
    let x = parseInt(regionInfoEle[2].innerText);
    let y = parseInt(regionInfoEle[3].innerText);
    // todo: check validity of above 4 values before passing to wasm.
    this.imgObj.crop(x, y, w, h);
    this.props.onSelectTool(''); // to unmount myself. Grandparent component will check 'selectedTool' value, then decide which to mount/unmount
    this.props.redraw();
  };

  render() {
    return (
        <div>
          {/*
             todo: add drop-down aspect ratio menu with items: Freeform, Original ratio, Golden ratio, Square 1x1, Photo 2x3
             add: checkbox: Lock Aspect Ratio
             make width/height an input box, changed values get reflected on crop handler
          */}
          {/* CropHandlers components has access to the following div DOM, thus, when user is moving cropHandlers, it'd update those Width/Height/X/Y value */}
          <div id='crop-region-info' className='handler-info' ref={div => this.cropRegion = div}
               style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', paddingLeft: '8px', paddingRight: '8px', marginBottom: '18px'}}>
            <div style={{marginBottom: '18px'}}>
              <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Width</label>
              <div className='canvas-handler-region-info'>{this.imgWidth + ' px'}</div>
            </div>
            <div style={{marginBottom: '18px'}}>
              <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Height</label>
              <div className='canvas-handler-region-info'>{this.imgHeight + ' px'}</div>
            </div>
            <div style={{marginBottom: '18px'}}>
              <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Top-left X</label>
              <div className='canvas-handler-region-info'>{0}</div>
            </div>
            <div style={{marginBottom: '18px'}}>
              <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Top-left Y</label>
              <div className='canvas-handler-region-info'>{0}</div>
            </div>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-around'}}>
            <button className='primary-btn apply-btn' onClick={this.onApply}>
              <svg viewBox="0 0 20 20" width="20" height="20" transform='scale(0.8, 0.8)'>
                <path fillRule="evenodd" fill='#FFF' d="M18.388 2L20 3.557 6.576 17.458 0 11.108 1.804 9.24l4.964 4.793L18.388 2z" />
              </svg>
            </button>
          </div>
        </div>
    )}
}
