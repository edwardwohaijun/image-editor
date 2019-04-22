import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';

export default class Basic extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      inverted: false,
      grayscaled: false,
      // opacity: 0,

      // there are too many evt in this component,\
      // the following 3 values are normalized in [-10, 10] for generalization purpose,\
      // thus, one handler(onChange) can cover them all, the value passed to wasm_img.adjust_hsi() are de-normalized by applying this.normalizeFactor object.
      hue: 0, // disable these 3 fields when grayscaled is true,
      saturation: 0,
      temperature: 0,
      // tint,
    };
    this.normalizeFactor = {
      hue: 2 * Math.PI / 20,
      saturation: 1/20,
      temperature: 10, // todo: limit the range to [-50, 50], step: 5
    };
    // when the component get mounted the first time, nothing changed yet, which is, logically, the same as change applied.
    this.changeApplied = true;
  }

  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  onChange = evt => {
    let valueType = evt.target.dataset.valueType;
    let valueChangeManner = evt.target.dataset.valueChange;
    let currentValue = this.state[valueType];
    let newValue;

    if (valueType === 'grayscaled' || valueType === 'inverted') {
      newValue = evt.target.checked
    } else {
      if (valueChangeManner === 'up') {
        newValue = Math.min(10, currentValue + 1)
    } else if (valueChangeManner === 'down') {
        newValue = Math.max(-10, currentValue - 1)
    } else if (valueChangeManner === 'set') {
        newValue = parseInt(evt.target.value);
      }
    }

    if (newValue === currentValue) {
      return
    }

    this.changeApplied = false;
    this.setState({[valueType]: newValue }, () => {
      let h = this.state.hue * this.normalizeFactor.hue;
      let s = this.state.saturation * this.normalizeFactor.saturation;
      let t = this.state.temperature * this.normalizeFactor.temperature;
      let g = this.state.grayscaled;
      let i = this.state.inverted;
      this.wasm_img.adjust_hsi(h, s, t, g, i);
      this.props.redraw();
    });
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };

  render() {
  // todo: rename class 'resize-view-btn' to 'btn-resize-value', think of a better one.
    let hue_sat_disabled = this.state.grayscaled;
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
            <div>Black & White</div>
            <div>
              <input type="checkbox" id="toggle-grayscale" className='toggle-input' style={{display:'none'}}
                     checked={this.state.grayscaled} onChange={this.onChange} data-value-type="grayscaled" data-value-change="set"/>
              <label htmlFor="toggle-grayscale" className="toggle-label"><span /></label>
            </div>
          </div>

          <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
            <div>Invert</div>
            <div>
              <input type="checkbox" id="toggle-invert" className='toggle-input' style={{display:'none'}}
                     checked={this.state.inverted} onChange={this.onChange} data-value-type="inverted" data-value-change="set"/>
              <label htmlFor="toggle-invert" className="toggle-label"><span /></label>
            </div>
          </div>

          <div style={{marginTop: '38px', marginBottom: '18px'}}>
          <div style={{marginBottom: '24px'}}>
            <div style={{paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <div>Hue</div>
              {/* use colorful slider, like https://www.outdoorphotographer.com/tips-techniques/photo-editing-tips/hue-and-saturation/ */}
              {/* todo: it'd be better to show: +/- 30 degree */}
              <div style={{paddingRight: '8px'}}>{this.state.hue}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className={'resize-view-btn ' + (hue_sat_disabled ? 'disabled' : '')} data-value-type='hue' data-value-change="down"
                      disabled={hue_sat_disabled} onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-hue-setter' className={hue_sat_disabled ? 'disabled' : ''} data-value-type='hue' data-value-change="set"
                     min='-10' max='10' step='1' value={this.state.hue} disabled={hue_sat_disabled} onChange={this.onChange}/>
              <button className={'resize-view-btn ' + (hue_sat_disabled ? 'disabled' : '')} data-value-type='hue' data-value-change="up"
                      disabled={hue_sat_disabled} onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>
          </div>

          <div style={{marginBottom: '24px'}}>
            <div style={{paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <div>Saturation</div>
              <div style={{paddingRight: '8px'}}>{this.state.saturation}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className={'resize-view-btn ' + (hue_sat_disabled ? 'disabled' : '')} data-value-type='saturation' data-value-change="down"
                      disabled={hue_sat_disabled} onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-saturation-setter' className={hue_sat_disabled ? 'disabled' : ''} data-value-type='saturation' data-value-change="set"
                     min='-10' max='10' step='1' value={this.state.saturation} disabled={hue_sat_disabled} onChange={this.onChange}/>
              <button className={'resize-view-btn ' + (hue_sat_disabled ? 'disabled' : '')} data-value-type='saturation' data-value-change="up"
                      disabled={hue_sat_disabled} onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>
          </div>

          <div style={{marginBottom: '24px'}}>
            <div style={{paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <div>Temperature</div>
              <div style={{paddingRight: '8px'}}>{this.state.temperature}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className='resize-view-btn ' data-value-type='temperature' data-value-change="down" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' data-value-type='temperature' data-value-change="set"
                     min='-10' max='10' step='1' value={this.state.temperature} onChange={this.onChange}/>
              <button className='resize-view-btn' data-value-type='temperature' data-value-change="up" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>
          </div>
          </div>

          <ApplyButton onApply={this.onApply}/>

        </div>
    )}
}
