import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';
import {showMiniHandlers} from "../../../actions";
import {bindActionCreators} from "redux";
import {connect} from "react-redux";

class Miniaturize extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      handlerVisible: true,
      // blurRadius: 15, // [10, 20, 2]
      sigma: 5,
      // saturation: 0,
      // brightness: 0,
      running: true,
    };
    this.heights = {top: 0, bottom: 0};
    this.topOrBottom = "both";
    this.changeApplied = false;
  }

  miniaturize = () => {
    if (!this.state.running) {
      this.setState({running: true})
    }
    setTimeout(() => {
      let sigma = this.state.sigma;
      let top, bottom;
      ({top, bottom} = this.heights);

      switch (this.topOrBottom) {
        case "both": {
          this.wasm_img.miniaturize(sigma, top, true);
          this.wasm_img.miniaturize(sigma, bottom, false);
          break;
        }
        case "top": {
          this.wasm_img.miniaturize(sigma, top, true);
          break
        }
        case "bottom": {
          this.wasm_img.miniaturize(sigma, bottom, false);
          break
        }
      }
      this.props.redraw();
      this.setState({running: false})
    }, 100);
  };

  componentDidMount = () => this.props.showHandler(true);
  componentWillUnmount = () => {
    this.props.showHandler(false);
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  componentDidUpdate = () => { // the only update is handler position, triggered from MinilHandlers by moving handlers.
    // but when miniHandlers get mounted, it'd call setMiniRegion() which is a redux action, \
    // then componentDidUpdate react to this store change by calling miniaturize().
    let top_height = this.props.heights.get('top');
    let bottom_height = this.props.heights.get('bottom');

    if (top_height < 0 || top_height > this.props.imgHeight || bottom_height < 0 || bottom_height > this.props.imgHeight) {
      return
    }

    // if this.miniaturize() is not running in setTimeout, the first miniaturize() call will block the second, \
    // which is the case when component get mounted, both calls will run to completion, \
    // but now miniaturize() is async, I don't know how Rust handle this, but it looks like the first call is not running, \
    // so, I have to make it explicit.
    if (this.heights.top !== top_height && this.heights.bottom !== bottom_height) {
      // this only happens when component get mounted the first time, default value of topHeight and bottomHeight are both 0, \
      // now they got assigned with new value from miniHandlers.
      this.topOrBottom = "both";
      this.heights.top = top_height;
      this.heights.bottom = bottom_height;
    } else if (this.heights.top !== top_height) {
      // these 2 cases happen when users drag one of the handlers
      this.topOrBottom = "top";
      this.heights.top = top_height;
    } else if (this.heights.bottom !== bottom_height) {
      this.topOrBottom = "bottom";
      this.heights.bottom = bottom_height;
    } else {
      return
    }

    this.miniaturize();
    this.changeApplied = false;
  };

  onChange = evt => {
    let tgt = evt.target;
    let changeManner = tgt.dataset.valueChange;
    let sigma;
    switch (changeManner) {
      case 'up': {
        sigma = Math.min(this.state.sigma + 2, 11);
        break;
      }
      case 'down': {
        sigma = Math.max(this.state.sigma - 2, 3);
        break;
      }
      case 'set': {
        sigma = parseInt(tgt.value);
        break;
      }
      default: return
    }

    if (sigma === this.state.sigma) {
      return
    }

    // when sigma changed, we need to apply it on both top and bottom
    this.topOrBottom = "both";
    this.setState({sigma}, this.miniaturize);
    this.changeApplied = false;
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };


  toggleHandlers = evt => {
    let handler = document.getElementById('canvas-handler');
    if (handler) {
      handler.style.visibility = evt.target.checked ? 'visible' : 'hidden';
      this.setState({handlerVisible: !this.state.handlerVisible})
    }
  };

  loadImage = evt => {
    this.props.onSelectTool(''); // to unmount myself.
    this.props.loadImage(evt.target.id);
  };

  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <div className='blinking-text' style={{visibility: this.state.running ? "visible" : "hidden"}}>Running</div>
          <div style={{display: 'flex', alignItems: 'center', marginBottom: '18px'}}>
            <button className={'resize-view-btn btn-plus-minus'} data-value-change="down" onClick={this.onChange}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
              </svg>
            </button>
            <input type='range' data-value-change="set" min='3' max='11' step='2' value={this.state.sigma} onChange={this.onChange} />
            <button className={'resize-view-btn btn-plus-minus'} data-value-change="up" onClick={this.onChange}>
              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
              </svg>
            </button>
          </div>

          <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
            <div>Show handler</div>
            <div>
              <input type="checkbox" id="toggle-mini-handlers" className='toggle-input' style={{display:'none'}}
                     checked={this.state.handlerVisible} onChange={this.toggleHandlers} />
              <label htmlFor="toggle-mini-handlers" className="toggle-label"><span /></label>
            </div>
          </div>

          <ApplyButton onApply={this.onApply}/>

          <p style={{fontSize: '12px', marginTop: '18px', color: '#ddd'}}>
            This filter make subject look like a miniature-scale model.
            The following 2 images best represent this filtering result.
          </p>
          <ul style={{fontSize: '12px', paddingLeft: '12px', color: '#00B7FF'}} onClick={this.loadImage}>
            <li className='clickable' id={`${URL_PATH}/img/stadium.jpg`}>Stadium</li>
            <li className='clickable' id={`${URL_PATH}/img/airport.jpg`}>Airport</li>
          </ul>
        </div>
    )}
}

const mapStateToProps = state => ({
  heights: state.miniHandlers.get('heights'),
  imgWidth: state.imgStat.get('width'),
  imgHeight: state.imgStat.get('height'),
});
const mapDispatchToProps = dispatch => bindActionCreators({showHandler: showMiniHandlers}, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Miniaturize);
