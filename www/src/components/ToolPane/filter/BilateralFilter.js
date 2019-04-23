import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';

export default class BilateralFilter extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      sigma_domain: 3, // kernel width = sigma_domain * 2, 3 is default
      sigma_range: 5, // don't bother changing it, 5 is an optimal value, leave it here for testing.
      iter_count: 3,
      running: true,
    };
    this.incr = 0; // when iter_count goes from 3 to 4(this.incr = 4 - 3), we pass 1 as iter_count to wasm.bilateral_filter()
    this.changeApplied = false; // Blur is applied the moment this component is loaded, thus, default should be 'false'
  }
  // "radius = 8, iter_count > 4, sigma_range = 5" will generate good cartoonish feel.

  // this.bf() would take about 20s to finish, when you click to enter into this component,\
  // page would hang with no response, after 20s, this component's DOM content would show up.
  // setTimeout won't change anything, just show the DOM first, telling people, the page is still running, then call bf().
  componentDidMount = () => setTimeout(this.bf, 0);
  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  bf = () => {
    setTimeout(() => {
      // this.incr is for iter_count, but when user change sigma_domain, we should pass 'incr = false' to recreate img from scratch, \
      // because the current img is based on old sigma_domain. To minimize the computation, just forget it.
      let iter_count = this.state.iter_count;
      let incr = false;
      if (this.incr > 0) {
        iter_count = this.incr;
        incr = true;
      }
      this.wasm_img.bilateral_filter(this.state.sigma_domain, this.state.sigma_range, iter_count, incr);
      this.props.redraw();
      this.setState({running: false})
    }, 100); // bf() is mostly triggered by onChange, although we put bf() call after setState completion, \
    // DOM update is not immediately in effect, wasm_img.bilateral_filter() still might precede the DOM update, \
    // causing no blinking 'running' text, postponing 100ms could fix this in an ugly way.
  };

  onChange = evt => {
    let tgt = evt.target;
    let valueType = tgt.dataset.valueType;
    let changeManner = tgt.dataset.valueChange;
    let value;
    switch (changeManner) {
      case 'up': {
        value = this.state[valueType] + 1;
        break;
      }
      case 'down': {
        value = this.state[valueType] - 1;
        break;
      }
      case 'set': {
        value = parseInt(tgt.value);
        break;
      }
      default: return
    }

    if (valueType === 'sigma_domain') {
      value = Math.min(Math.max(value, 1), 12);
    } else if (valueType === 'iter_count') {
      value = Math.min(Math.max(value, 1), 6);
    } else {
      return
    }

    if (value === this.state[valueType]) {
      this.incr = 0;
      return
    } else {
      this.incr = value - this.state[valueType]
    }

    this.setState({[valueType]: value, running: true}, this.bf);
    this.changeApplied = false;
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };

  loadImage = evt => {
    this.props.onSelectTool('');
    this.props.loadImage(evt.target.id);
  };

  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <div className='blinking-text' style={{visibility: this.state.running ? "visible" : "hidden"}}>Running</div>
          <div style={{marginBottom: '24px'}}>
            <div style={{paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <div>
                <div>Iteration Count</div>
                <span style={{fontSize: '11px'}}>More count, more smooth</span>
              </div>
              <div style={{paddingRight: '8px'}}>{this.state.saturation}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className='resize-view-btn' data-value-type='iter_count' data-value-change="down" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' data-value-type='iter_count' data-value-change="set"
                     min='1' max='6' step='1' value={this.state.iter_count} onChange={this.onChange}/>
              <button className='resize-view-btn' data-value-type='iter_count' data-value-change="up" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>
          </div>

          <div style={{marginBottom: '24px'}}>
            <div style={{paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <div>
                <div>Radius</div>
                <span style={{fontSize: '11px'}}>Big image should have big radius</span>
              </div>
              <div style={{paddingRight: '8px'}}>{this.state.saturation}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className='resize-view-btn' data-value-type='sigma_domain' data-value-change="down" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' data-value-type='sigma_domain' data-value-change="set"
                     min='1' max='12' step='1' value={this.state.sigma_domain} onChange={this.onChange}/>
              <button className='resize-view-btn' data-value-type='sigma_domain' data-value-change="up" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>
          </div>

          <p style={{fontSize: '12px', marginTop: '18px', color: '#ddd'}}>
            when the above 2 sliders approach max value(takes long time to finish), this filter will generate cartoonish feel.
          </p>

          <ApplyButton onApply={this.onApply}/>

          <p style={{fontSize: '12px', marginTop: '18px', color: '#ddd'}}>
            The following 2 celebrity images best represent this filtering result.
          </p>
          <ul style={{fontSize: '12px', paddingLeft: '12px', color: '#00B7FF'}} onClick={this.loadImage}>
            <li className='clickable' id={`${URL_PATH}/img/EddieRedmayne.jpg`}>Eddie Redmayne</li>
            <li className='clickable' id={`${URL_PATH}/img/EmmaStone.jpg`}>Emma Stone</li>
          </ul>
        </div>
    )}
}
