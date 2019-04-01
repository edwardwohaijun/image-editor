import imgObj from '../../common/imgObj'
import React, {Component} from 'react';

export default class Exposure extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      contrastAdjustMode: ''
    }
  }

  autoSet = () => {
    this.wasm_img.auto_adjust_intensity();
    this.props.redraw();
  };

  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <button onClick={this.autoSet}>test 'adjust intensity'</button>
          <div style={{marginBottom: '24px'}}>
            <div style={{paddingLeft: '8px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
              <div>Brightness</div>
              <div style={{paddingRight: '8px'}}>Brightness value</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className='resize-view-btn' id='color-brightness-slidedown-btn' onClick={this.onScaleChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-brightness-setter' min='10' max='100' step='10' value={this.state.scaleFactor} onChange={this.onScaleChange} />
              <button className='resize-view-btn' id='color-brightness-slideup-btn' onClick={this.onScaleChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>
          </div>

          <div style={{border: '1px solid #373842'}}>
            <div>Contrast</div>
            <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
              <div>Auto adjust</div>
              <div>
                <input type="radio" id="auto-adjust-contrast" name='color-contrast-adjust' className='radio-input' style={{display:'none'}}/>
                <label htmlFor="auto-adjust-contrast" className="radio-label"><span /></label>
              </div>
            </div>

            <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
              <div>Manual adjust</div>
              <div>
                <input type="radio" id="manual-adjust-contrast" checked={true} name='color-contrast-adjust' className='radio-input' style={{display:'none'}}/>
                <label htmlFor="manual-adjust-contrast" className="radio-label"><span /></label>
              </div>
            </div>

            <div style={{display: 'flex', alignItems: 'center'}}>
              <button className='resize-view-btn' id='color-contrast-slidedown-btn' onClick={this.onScaleChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                  <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                  <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                </svg>
              </button>
              <input type='range' id='color-contrast-setter' min='10' max='100' step='10' value={this.state.scaleFactor} onChange={this.onScaleChange} />
              <button className='resize-view-btn' id='color-contrast-slideup-btn' onClick={this.onScaleChange}>
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                  <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                  <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                </svg>
              </button>
            </div>

          </div>


          {/* highlight */}
          {/* shadow */}
        </div>
    )}
}
