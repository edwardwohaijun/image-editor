import imgObj from '../../common/imgObj'
import React, {Component} from 'react';

export default class Basic extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      inverted: false,
      grayscaled: false,
      opacity: 0,
      hue: 0,
      saturation: 0,
      temperature: 0,
    }
  }

  /*
  invert[*], grayscale[*], opacity
          Hue, Saturation, Temperature, Optional Tint
          (RGB curve) later
   */

  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
            <div>Black & White</div>
            <div>
              <input type="checkbox" id="toggle-grayscale" className='toggle-input' style={{display:'none'}}/>
              <label htmlFor="toggle-grayscale" className="toggle-label"><span /></label>
            </div>
          </div>

          <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
            <div>Invert</div>
            <div>
              <input type="checkbox" id="toggle-invert" className='toggle-input' style={{display:'none'}}/>
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
              <button className='resize-view-btn' id='color-hue-slidedown-btn' onClick={this.onScaleChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-hue-setter' min='10' max='100' step='10' value={this.state.scaleFactor} onChange={this.onScaleChange} />
              <button className='resize-view-btn' id='color-hue-slideup-btn' onClick={this.onScaleChange}>
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
              <button className='resize-view-btn' id='color-saturation-slidedown-btn' onClick={this.onScaleChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-saturation-setter' min='10' max='100' step='10' value={this.state.scaleFactor} onChange={this.onScaleChange} />
              <button className='resize-view-btn' id='color-saturation-slideup-btn' onClick={this.onScaleChange}>
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
              <button className='resize-view-btn' id='color-temp-slidedown-btn' onClick={this.onScaleChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-temp-setter' min='10' max='100' step='10' value={this.state.scaleFactor} onChange={this.onScaleChange} />
              <button className='resize-view-btn' id='color-temp-slideup-btn' onClick={this.onScaleChange}>
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
              <svg viewBox="0 0 20 20" width="20" height="20" transform='scale(0.8, 0.8)'>
                <path fillRule="evenodd" fill='#FFF' d="M18.388 2L20 3.557 6.576 17.458 0 11.108 1.804 9.24l4.964 4.793L18.388 2z" />
              </svg>
            </button>
          </div>

        </div>
    )}
}
