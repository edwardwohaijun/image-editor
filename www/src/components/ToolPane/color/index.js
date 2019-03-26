// grayscale, opacity, invert, 不是有个js/wasm video editing的效果对比吗, 上面全是color相关的操作.
// contrast, brightness,
// saturation, hue, temperature, R, G, B (单独设置)

import {memory} from "image-editor/image_editor_bg";
import React, {Component} from 'react';

const listItemStyle = {marginBottom: '30px'};

class ColorTool extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = () => { };
  componentDidUpdate = () => { };

  updateEditorValue = evt => {
    let editorItem = evt.target.id.split('-')[0];
    let editorValue = evt.target.value;
    this.props.updateEditorValue('color', editorItem, editorValue);
    console.log('inside colorTool: ', editorItem, '/', editorValue)
  };

  // todo: add some help tips at the end of page
  // like: after applying the contrast auto-adjust, it's better to increase the Saturation a little
  render() {
    let v = this.props.editorValues;
    return (
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <ul style={{listStyleType: 'none', paddingLeft: 0}}>
            <li style={listItemStyle}>
              <div className='editor-item-label'>contrast</div>
              <input id='contrast-slider' type='range' min='1' max='100' step='1'
                     onChange={this.updateEditorValue} value={v.get('contrast')}/>
            </li>

            <li style={listItemStyle}>
              <div className='editor-item-label'>BRIGHTNESS</div>
              <input id='brightness-slider' type='range' min='1' max='100' step='1'
                     onChange={this.updateEditorValue} value={v.get('brightness')}/>
            </li>

            <li style={listItemStyle}>
              <div className='editor-item-label'>SATURATION</div>
              <input id='saturation-slider' type='range' min='1' max='100' step='1'
                     onChange={this.updateEditorValue} value={v.get('saturation')}/>
            </li>

            <li style={listItemStyle}>
              <div className='editor-item-label'>HUE</div>
              <input id='hue-slider' type='range' min='1' max='100' step='1'
                     onChange={this.updateEditorValue} value={v.get('hue')}/>
            </li>

            <li style={listItemStyle}>
              <div className='editor-item-label'>TEMPERATURE</div>
              <input id='temperature-slider' type='range' min='1' max='100' step='1'
                     onChange={this.updateEditorValue} value={v.get('temperature')}/>
            </li>

          </ul>
        </div>
    )}
}

export default ColorTool
