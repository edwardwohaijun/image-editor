import imgObj from '../common/imgObj'
import {memory} from "image-editor/image_editor_bg";
import React, {Component} from 'react';
import {fromJS} from 'immutable'

import BasicTool from './basic';
import ColorTool from './color';
import FilterTool from './filter';
import TextTool from './text';
import TransformTool from './transform';

// todo: rename this to: Accordion MenuList
// todo: write a slider component to be used in each editor's for-loop.
class ToolPropList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      basic: fromJS({
        b1: 2,
        b2: 3,
      }),
      color: fromJS({
        grayscale: false,
        contrast: 10,
        brightness: 20,

        hue: 30,
        saturation: 40,
        temperature: 50,

        red: 60,
        green: 70,
        blue: 80,
      }),
      filter: fromJS({
        gaussianBlur: 90,
        motionBlur: 100,

      }),
      transform: fromJS({
        flipH: true,

      }),
    };
  }

  // after each operation performed by wasm, we need to redraw the canvas with data read from Rust
  redraw = reposition => { // todo: 最好pass一个arg, indicating whether ratio need to be applied, most operations like: filter/color don't change ratio
    let wasm_img = imgObj.get_wasm_img();
    let w = wasm_img.width();
    let h = wasm_img.height();
    let pixelPtr = wasm_img.pixels();
    const pixels = new Uint8Array(memory.buffer, pixelPtr, w * h * 4);
    createImageBitmap(new ImageData(new Uint8ClampedArray(pixels), w, h))
        .then(img => {
          imgObj.imgBuff = img;
          let ratio = this.props.zoomRatio;
          let canvas = document.getElementById('canvas');
          canvas.width = w * ratio;
          canvas.height = h * ratio;
          console.log('inside redraw, canvas w/h: ', w , '/', h, '/', ratio);
          let ctx = canvas.getContext('2d');
          ctx.scale(ratio, ratio);
          ctx.drawImage(img, 0, 0);
        });
  };

  updateEditorValue = (type, item, value) => { // todo: 其实可以在element上添加 data-*** attribute, 就不用本例那么麻烦, 一个handler pass下去即可.
    let valueList = this.state[type];
    this.setState({
      [type]: valueList.set(item, value)
    })
  };

  componentDidMount = () => {

  };

  componentDidUpdate = () => {

  };

  render() {
    let tool;
    let label;
    switch (this.props.selectedTool) {
      case 'tool-basic': label = 'BASIC'; tool = <BasicTool editorValues={this.state.basic} updateEditorValue={this.updateEditorValue} redraw={this.redraw}/>; break;
      case 'tool-color': label = 'COLOR'; tool = <ColorTool editorValues={this.state.color} updateEditorValue={this.updateEditorValue} redraw={this.redraw}/>; break;
      case 'tool-filter': label = 'FILTER'; tool = <FilterTool editorValues={this.state.filter} updateEditorValue={this.updateEditorValue} redraw={this.redraw}/>; break;
      case 'tool-text': label = 'TEXT'; tool = <TextTool editorValues={this.state.text} updateEditorValue={this.updateEditorValue} redraw={this.redraw}/>; break;
      case 'tool-transform': label = 'TRANSFORM'; tool = <TransformTool editorValues={this.state.transform} updateEditorValue={this.updateEditorValue} redraw={this.redraw}/>; break;
      default: return null
    }
    return <Header close={this.props.close} label={label}>{tool}</Header>
  }
}

export default ToolPropList

const Header = props => {
  return (
      <div style={{padding: '6px 20px', height: '100%'}}>
        <div style={{marginBottom: '18px', padding: 0, display: 'flex', alignItems: 'center'}}>
          <button id='editor-goback-btn' onClick={props.close}>
            <svg viewBox="0 0 20 20" width="100%" height="100%" fill='#ccc' pointerEvents='none'>
              <g fillRule="evenodd">
                <path fillRule="nonzero" d="M10 19a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0 1C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10z" />
                <path d="M5.448 10.863L5 10.414 8.414 7l.897.897-2.561 2.56 2.69 2.69-.854.853-3.138-3.137z"/>
                <path d="M6 10h9v1H6z"/>
              </g>
            </svg>
          </button>
          <span style={{color: '#ccc', fontSize: '18px', marginLeft: '8px'}}>{props.label}</span>
        </div>
        {props.children}
      </div>
  )
};