import imgObj from '../../common/imgObj'
import React, {Component} from 'react';

export default class Basic extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      inverted: false,
      grayscaled: false,
      // opacity: 0,

      // there are too many evt handlers in this component,\
      // the following 3 values are normalized in [-10, 10] for generalization purpose,\
      // thus, one handler can cover them all, the value passed to wasm_img are de-normalized
      hue: 0, // disable these 3 fields when grayscaled: true,
      saturation: 0, // technically,
      temperature: 0,
      // tint,
    };
    // when the component get mounted the first time, nothing changed yet, which is, logically, the same as change applied.
    this.changeApplied = true;

    // pub fn adjust_hsi(&mut self, hue_amt: f64, saturation_amt: f64, grayscaled: bool, inverted: bool) {...}
    this.op = {
      'grayscaled': v => {
        console.log('grayscaled: ', v);
        this.wasm_img.adjust_hsi(2 * Math.PI * this.state.hue / 20, this.state.saturation / 20, v, this.state.inverted);
      },
      'inverted': v => {
        this.wasm_img.adjust_hsi(2 * Math.PI * this.state.hue / 20, this.state.saturation / 20, this.state.grayscaled, v);
        console.log('inverted: ', v);
      },
      'hue': v => {
        console.log('hue changed: ', 2 * Math.PI * v / 20, '/', v); // is [-10, 10] too wide?
        this.wasm_img.adjust_hsi(2 * Math.PI * v / 20, this.state.saturation / 20, this.state.grayscaled, this.state.inverted);
      },
      'saturation': v => {
        console.log('saturation changed: but original hue: ', 2 * Math.PI * this.state.hue / 20);
        this.wasm_img.adjust_hsi(2 * Math.PI * this.state.hue / 20, v / 20, this.state.grayscaled, this.state.inverted);
      },
      'temperature': v => {
        console.log('temperature: ', v);
        //this.wasm_img.hue(v)
      },
    }
  }

  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };
  // shouldComponentUpdate = (nextProps, nextState) => { };

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

    this.op[valueType](newValue);
    this.props.redraw();
    this.changeApplied = false;
    this.setState({ [valueType]: newValue });
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.applyChange();
    // todo: prepare to unmount myself
  };

  render() {
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
              <div style={{paddingRight: '8px'}}>Hue value</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className='resize-view-btn value-down' data-value-type='hue' data-value-change="down" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-hue-setter' data-value-type='hue' data-value-change="set"
                     min='-10' max='10' step='1' value={this.state.hue} onChange={this.onChange}/>
              <button className='resize-view-btn value-up' data-value-type='hue' data-value-change="up" onClick={this.onChange}>
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
              <div style={{paddingRight: '8px'}}>Sat value</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className='resize-view-btn value-down' data-value-type='saturation' data-value-change="down" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-saturation-setter' className='value-setter' data-value-type='saturation' data-value-change="set"
                     min='-10' max='10' step='1' value={this.state.saturation} onChange={this.onChange}/>
              <button className='resize-view-btn value-up' data-value-type='saturation' data-value-change="up" onClick={this.onChange}>
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
              <div style={{paddingRight: '8px'}}>T value</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className='resize-view-btn value-down' data-value-type='temperature' data-value-change="down" onClick={this.onChange}>
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

          <div style={{display: 'flex', justifyContent: 'space-around'}}>
            <button className='primary-btn apply-btn' onClick={this.onApply}>
              <svg viewBox="0 0 20 20" width="20" height="20" transform='scale(0.8, 0.8)' pointerEvents='none'>
                <path fillRule="evenodd" fill='#FFF' d="M18.388 2L20 3.557 6.576 17.458 0 11.108 1.804 9.24l4.964 4.793L18.388 2z" />
              </svg>
            </button>
          </div>

        </div>
    )}
}
