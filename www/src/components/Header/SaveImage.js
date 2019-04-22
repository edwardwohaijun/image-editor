import React, {Component} from 'react';
import imgObj from '../common/imgObj';
import {memory} from "image-editor/image_editor_bg";
let wasm_img = imgObj.get_wasm_img();

const BtnWrapperStyle = {height: '36px', display: 'flex', alignItems: 'center', position: 'relative'};
export default class Save extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  onSave = () => {
    // the current drawing canvas is zoom-ratio applied, if we use this one to download the canvas img \
    // the img dimension will not be the original size.
    let canvas = document.createElement('canvas');
    let w = wasm_img.width(); // if user scale down the img, but hasn't applied the change, the width/height is the scaled version
    let h = wasm_img.height(); // need to add a note, telling people not to forget to 'apply'
    canvas.width = w;
    canvas.height = h;
    let pixelPtr = wasm_img.pixels();
    const pixels = new Uint8Array(memory.buffer, pixelPtr, w * h * 4);
    createImageBitmap(new ImageData(new Uint8ClampedArray(pixels), w, h))
        .then(img => {
          let ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(blob => { // toDataURL failed for big canvas
            let link = document.createElement('a');
            link.download = "download.png";
            link.href = URL.createObjectURL(blob);
            link.click();
          }, 'image/png'); // todo: add a img quality slider(jpeg only), and allow users to choose file format(jpg or png).
        });
  };

  render() {
    return (
        <div style={BtnWrapperStyle}>
          <button className='img-file-handler-btn' onClick={this.onSave}>Save</button>
        </div>
    )}
}
