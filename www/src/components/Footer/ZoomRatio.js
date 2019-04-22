import React, {Component} from 'react';
import {setZoomRatio} from '../../actions'
import { connect } from 'react-redux';
import {bindActionCreators} from "redux";

class ZoomRatio extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  onResize = evt => this.props.setZoomRatio(evt.target.value);

  setRatio = evt => {
    let zoomRatio = this.props.zoomRatio;
    if (zoomRatio > 4 || zoomRatio < 0.2) { // todo: make zoom range a constant
      return
    }

    let zoomBtnCls = evt.target.classList;
    if (zoomBtnCls.contains('zoom-out')) {
      this.props.setZoomRatio(Math.max(zoomRatio - 0.2, 0.2))
    } else if (zoomBtnCls.contains('zoom-in')) {
      this.props.setZoomRatio(Math.min(zoomRatio + 0.2, 4))
    } else if (zoomBtnCls.contains('fit-to-screen')) {
      this.props.resizeCanvas(true)
    }
  };

  render() {
    // todo: on range slider, add a btn at '100%', sometimes, we just need the original size without zooming.
    return (
        <div style={{display: 'flex', alignItems: 'center'}}>

          <button className='resize-view-btn fit-to-screen' onClick={this.setRatio}>
            <svg viewBox="-4 -4 22 22" width="22" height="22" fill='white' pointerEvents='none'>
              <path fillRule="evenodd" d="M11.2 4H6V3h7v7h-1V4.6l-8.3 8.3-.7-.7L11.2 4zM0 0h16v16H0V0zm1 1v14h14V1H1z" />
            </svg>
          </button>

          <button className='resize-view-btn zoom-out' onClick={this.setRatio}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
              <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
              <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
            </svg>
          </button>

          <input type='range' id='view-size-setter' min='0.2' max='4' step='0.2'
                 onChange={this.onResize} value={this.props.zoomRatio}/>

          <button className='resize-view-btn zoom-in' onClick={this.setRatio}>
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
              <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
              <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
            </svg>
          </button>

          <span style={{marginLeft: '8px', color: '#FFF'}}>{Math.round(this.props.zoomRatio * 100) + '%'}</span>
        </div>
    )}
}

const mapStateToProps = state => ({zoomRatio: state.imgStat.get('zoomRatio')});
const mapDispatchToProps = dispatch => bindActionCreators({setZoomRatio},dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(ZoomRatio);
