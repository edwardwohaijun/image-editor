import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';

export default class Exposure extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      contrastAdjustMode: 'manual',
      contrast: 10,
      brightness: 0,
    };
    this.normalizeFactor = {
      contrast: 1/10, // slider range: [1, 20], default is 10,
      brightness: 5 / 255, // slider range: [-10, 10], default is 0. Each increment...
    };
    this.sliderRange = {
      contrast: [1, 20, 1], // [min, max, step]
      brightness: [10, 10, 1],
    };
    this.changeApplied = true;
  }

  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  onChange = evt => {
    let tgt = evt.target;

    if (tgt.type === 'radio') {
      this.changeApplied = false;
      let contrastAdjustMode = tgt.dataset.adjustMode;
      if (contrastAdjustMode === 'auto') {
        this.wasm_img.auto_adjust_intensity();
      } else if (contrastAdjustMode === 'manual') {
        let c = this.state.contrast * this.normalizeFactor.contrast;
        let b = this.state.brightness * this.normalizeFactor.brightness;
        this.wasm_img.manual_adjust_intensity(c, b);
      } else {
        return
      }

      this.props.redraw();
      this.setState({contrastAdjustMode});
      return
    }

    let valueType = tgt.dataset.valueType;
    let valueChangeManner = tgt.dataset.valueChange;
    let currentValue = this.state[valueType];
    let newValue;

    let min, max, step;
    if (tgt.classList.contains('btn-plus-minus')) { // make sure all 'plus', 'minus' buttons have 'btn-plus-minus' class.
      let rangeEle = tgt.parentElement.querySelector('input[type=range]');
      max = parseInt(rangeEle.getAttribute('max'));
      min = parseInt(rangeEle.getAttribute('min'));
      step = parseInt(rangeEle.getAttribute('step'));
    }

    if (valueChangeManner === 'up') {
      newValue = Math.min(max, currentValue + step)
    } else if (valueChangeManner === 'down') {
      newValue = Math.max(min, currentValue - step)
    } else if (valueChangeManner === 'set') {
      newValue = parseInt(evt.target.value);
    }

    if (newValue === currentValue) {
      return
    }

    this.changeApplied = false;
    this.setState({[valueType]: newValue}, () => {
      let c = this.state.contrast * this.normalizeFactor.contrast;
      let b = this.state.brightness * this.normalizeFactor.brightness;
      this.wasm_img.manual_adjust_intensity(c, b);
      this.props.redraw();
    });
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };

  // todo: add a curve, giving users a fine-grained control on contrast
  render() {
    let autoAdjustContrast = this.state.contrastAdjustMode === 'auto';
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <div style={{marginBottom: '24px'}}>
            <div style={{paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <div>Brightness</div>
              <div style={{paddingRight: '8px'}}>Brightness value</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className={'resize-view-btn btn-plus-minus ' + (autoAdjustContrast ? 'disabled' : '')} disabled={autoAdjustContrast}
                      onClick={this.onChange} data-value-type='brightness' data-value-change="down">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' className={autoAdjustContrast ? 'disabled' : ''} disabled={autoAdjustContrast}
                     min='-10' max='10' step='1' value={this.state.brightness}
                     data-value-type='brightness' data-value-change="set" onChange={this.onChange} />
              <button className={'resize-view-btn btn-plus-minus ' + (autoAdjustContrast ? 'disabled' : '')} disabled={autoAdjustContrast}
                      data-value-type='brightness' data-value-change="up" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>
          </div>

          <div style={{border: '1px solid #373842', marginBottom: '18px', paddingTop: '8px', paddingBottom: '8px'}}>
            <div style={{paddingLeft: '8px', marginBottom: '18px'}}>Contrast</div>
            <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
              <div>Auto adjust</div>
              <div>
                <input type="radio" id="auto-adjust-contrast" checked={this.state.contrastAdjustMode === 'auto'} value={this.state.contrastAdjustMode}
                       name='color-contrast-adjust' className='radio-input' style={{display:'none'}} onChange={this.onChange} data-adjust-mode="auto"/>
                <label htmlFor="auto-adjust-contrast" className="radio-label"><span /></label>
              </div>
            </div>

            <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
              <div>Manual adjust</div>
              <div>
                <input type="radio" id="manual-adjust-contrast" checked={this.state.contrastAdjustMode === 'manual'} value={this.state.contrastAdjustMode}
                       name='color-contrast-adjust' className='radio-input' style={{display:'none'}} onChange={this.onChange} data-adjust-mode="manual"/>
                <label htmlFor="manual-adjust-contrast" className="radio-label"><span /></label>
              </div>
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className={'resize-view-btn btn-plus-minus ' + (autoAdjustContrast ? 'disabled' : '')} disabled={autoAdjustContrast}
                      data-value-type='contrast' data-value-change="down" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' className={autoAdjustContrast ? 'disabled' : ''} disabled={autoAdjustContrast}
                     data-value-type='contrast' data-value-change="set"  min='1' max='20' step='1' value={this.state.contrast} onChange={this.onChange} />
              <button className={'resize-view-btn btn-plus-minus ' + (autoAdjustContrast ? 'disabled' : '')} disabled={autoAdjustContrast}
                      data-value-type='contrast' data-value-change="up" onClick={this.onChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>

          </div>

          <ApplyButton onApply={this.onApply}/>

        </div>
    )}
}
