import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import {setWidthHeight} from "../../../actions";
import {bindActionCreators} from "redux";
import {connect} from "react-redux";

// todo: to allow to scale up, and use ctx.scale instead of wasm
class Scale extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.imgWidth = props.imgWidth; // this.wasm_img.width(); // these 2 values are accessed frequently, but got changed only after clicking apply btn,
    this.imgHeight = props.imgHeight; // this.wasm_img.height(); // and changed values can be calculated in JS land, no need to access wasm.
    this.scaleRegion = null;
    this.changeApplied = true; // when component get mounted, nothing changed yet, which, logically, is equal to 'change applied'

    this.state = {scaleFactor: 100} // use integer to get rid of rounding error when shown on page.
  }

  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  onScaleChange = evt => {
    let eleID = evt.target.id;
    let scaleFactor = 1;
    switch (eleID) {
      case 'transform-scale-setter': {
        scaleFactor = parseInt(evt.target.value); // evt.target.value is text not number
        break;
      }
      case 'transform-scale-down-btn': {
        scaleFactor = Math.max(this.state.scaleFactor - 10, 10);
        break;
      }
      case 'transform-scale-up-btn': {
        scaleFactor = Math.min(this.state.scaleFactor + 10, 100);
        break;
      }
      default: return
    }


    if (this.state.scaleFactor === scaleFactor) {
      return
    }

    this.wasm_img.scale(scaleFactor / 100); // todo: pass width/height, not factor to 'scale' to avoid rounding error
    this.props.redraw();
    this.setState({scaleFactor});
    this.changeApplied = false;
  };

  onApply = evt => { // todo: parse 4 values to integer before passing to scale();
    this.imgWidth = Math.round(this.imgWidth * this.state.scaleFactor / 100); // this.wasm_img.width();
    this.imgHeight = Math.round(this.imgHeight * this.state.scaleFactor / 100); // this.wasm_img.height();
    this.props.setWidthHeight({width: this.imgWidth, height: this.imgHeight});

    this.wasm_img.apply_change();
    // this.setState({scaleFactor: 100});
    this.changeApplied = true;
    // it's too complicated to re-calculate the new position of CropHandlers after crop, so I just unmount current component to hide CropHandler
    this.props.onSelectTool('') // unmount myself. Grandparent component will check 'selectedTool' value, then decide which to mount/unmount
  };

  render() {
    let scale = this.state.scaleFactor;
    return (
        <div>
          {/*
              todo: add: checkbox 'Lock Aspect Ratio'
              make ratio an input box, changed values get reflected on scale handler
          */}
          <div id='scale-region-info' className='handler-info' ref={div => this.scaleRegion = div}
               style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', paddingLeft: '8px', paddingRight: '8px', marginBottom: '0'}}>
            <div style={{marginBottom: '18px'}}>
              <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Width</label>
              <div className='canvas-handler-region-info'>{Math.round(scale * this.imgWidth / 100) + ' px'}</div>
            </div>
            <div style={{marginBottom: '18px'}}>
              <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Height</label>
              <div className='canvas-handler-region-info'>{Math.round(scale * this.imgHeight / 100) + ' px'}</div>
            </div>
            <div style={{marginBottom: '18px'}}>
              <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Ratio</label>
              <div className='canvas-handler-region-info'>{scale + ' %'}</div>
            </div>
          </div>

          <div style={{display: 'flex', alignItems: 'center', marginBottom: '24px'}}>
            <button className='resize-view-btn' id='transform-scale-down-btn' onClick={this.onScaleChange}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
              </svg>
            </button>

            <input type='range' id='transform-scale-setter' min='10' max='100' step='10' value={this.state.scaleFactor} onChange={this.onScaleChange} />

            <button className='resize-view-btn' id='transform-scale-up-btn' onClick={this.onScaleChange}>
              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
              </svg>
            </button>
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

const mapStateToProps = state => ({
  imgWidth: state.imgStat.get('width'),
  imgHeight: state.imgStat.get('height'),
});
const mapDispatchToProps = dispatch => bindActionCreators({setWidthHeight}, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Scale);
