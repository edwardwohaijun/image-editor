import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';

export default class GaussianBlur extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      radius: 5, // [1, 11, 2], [min, max, step]
      running: true,
    };
    this.changeApplied = false; // Blur is applied the moment this component is loaded, thus, default should be 'false'
  }

  componentDidMount = () => setTimeout(this.blur, 0);
  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  blur = () => {
    setTimeout(() => {
      this.wasm_img.blur(this.state.radius);
      this.props.redraw();
      this.setState({running: false})
    }, 100);
  };

  onChange = evt => {
    let tgt = evt.target;
    let changeManner = tgt.dataset.valueChange;
    let radius;
    switch (changeManner) {
      case 'up': {
        radius = Math.min(this.state.radius + 2, 11);
        break;
      }
      case 'down': {
        radius = Math.max(this.state.radius - 2, 1);
        break;
      }
      case 'set': {
        radius = parseInt(tgt.value);
        break;
      }
      default: return
    }

    if (radius === this.state.radius) {
      return
    }

    this.setState({radius, running: true}, this.blur);
    this.changeApplied = false;
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };

  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <div className='blinking-text' style={{visibility: this.state.running ? "visible" : "hidden"}}>Running</div>
          <div style={{marginBottom: '24px'}}>
            <div style={{paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <div>Gaussian Blur</div>
              <div style={{paddingRight: '8px'}}>{this.state.saturation}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className='resize-view-btn' data-value-type='gaussian-blur' data-value-change="down" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-saturation-setter' data-value-type='gaussian-blur' data-value-change="set"
                     min='1' max='11' step='2' value={this.state.radius} onChange={this.onChange}/>
              <button className='resize-view-btn' data-value-type='gaussian-blur' data-value-change="up" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>
          </div>
          <ApplyButton onApply={this.onApply}/>

          <p style={{fontSize: '12px', marginTop: '18px', color: '#ddd'}}>
            Gaussian blur is mostly used for removing noise, frosted glass effect.
            This implementation... do I need to mention sth technical here??
          </p>
        </div>
    )}
}
