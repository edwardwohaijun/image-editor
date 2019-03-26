// flip-h/v, rotate 90/180(other degrees to be add later), shrea
// scale up/down
import imgObj from '../../common/imgObj'
import React, {Component} from 'react';

export default class Crop extends Component {
  constructor(props) {
    super(props);
    this.imgObj = imgObj.getImgObj();
    this.cropRegion = null;
    this.state = {
    }
  }

  componentDidMount = () => { };
  // todo: 现在的做法: crophandler中的didmount, 修改这里的 regionInfo, 改为:
  // 这里的didMount中修改, 因为初始值, 我这里可以获取. 只有handler变化时, 才需要 handler那里修改.
  // 而且handler didmount时, 我这里是否mounted了, 还未知, 现在是没问题, 但总感觉不妥.

  componentDidUpdate = prevProps => { };
  componentWillUnmount = () => { };

  onApply = evt => { // todo: parse 4 values to integer before passing to crop();
    let regionInfoEle = this.cropRegion.getElementsByClassName('canvas-handler-region-info');
    let w = parseInt(regionInfoEle[0].innerText); // only block element support innerText, like div
    let h = parseInt(regionInfoEle[1].innerText);
    let x = parseInt(regionInfoEle[2].innerText);
    let y = parseInt(regionInfoEle[3].innerText);
    console.log('xywh from DOM: ', x, '/', y, '/', w, '/', h);
    // todo: check validity of above 4 values before passing to wasm.
    this.imgObj.crop(x, y, w, h);
    this.props.onSelectTool(''); // to hide the Crop setting pane
    this.props.redraw();
  };

  render() {
    let svgStyle = this.props.selectedTool === 'transform-crop' ? {transform: 'rotate(180deg)'} : {transform: 'rotate(0deg)'};
    return (
        <div className='editor-header-wrapper'>
          <div id='transform-crop' className='editor-header' onClick={this.props.onSelectTool}>
            <span>CROP</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="8" className='svg-down-arrow' style={svgStyle}>
              <path fill="#CCC" d="M7.19 7.54L0 .34.34 0l6.85 6.85L14.04 0l.34.34-7.19 7.2z"/>
            </svg>
          </div>
          {
            this.props.selectedTool !== 'transform-crop' ? null :
                <div>
                  {/*
                  todo: add drop-down aspect ratio menu with items: Freeform, Original ratio, Golden ratio, Square 1x1, Photo 2x3
                  add: checkbox: Lock Aspect Ratio
                  make width/height an input box, changed values get reflected on crop handler
                  */}
                  <div id='crop-region-info' className='handler-info' ref={div => this.cropRegion = div}
                       style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', paddingLeft: '8px', paddingRight: '8px', marginBottom: '18px'}}>
                    <div style={{marginBottom: '18px'}}>
                      <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Width</label>
                      <div className='canvas-handler-region-info' />
                    </div>
                    <div style={{marginBottom: '18px'}}>
                      <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Height</label>
                      <div className='canvas-handler-region-info' />
                    </div>
                    <div style={{marginBottom: '18px'}}>
                      <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Top-left X</label>
                      <div className='canvas-handler-region-info' />
                    </div>
                    <div style={{marginBottom: '18px'}}>
                      <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Top-left Y</label>
                      <div className='canvas-handler-region-info' />
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
          }
        </div>
    )}
}
