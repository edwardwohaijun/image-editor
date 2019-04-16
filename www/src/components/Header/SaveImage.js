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

  componentDidMount = () => { };
  componentDidUpdate = () => { };

  onSave = () => {
    // the current drawing canvas is zoom-ratio applied, if we use this one to download the canvas img \
    // the img file will use the ratio applied width/height
    let canvas = document.createElement('canvas');
    let w = wasm_img.width(); // if user scale down the img, but hasn't applied the change, we need to read the original width/height
    let h = wasm_img.height(); // if user has applied the changes, then width_bk() is the same as width().
    canvas.width = w; // todo: 如果真的, scale down了, 但未apply, 那此刻 得到的pixels 也是scale down的数据, w/h 读取bk又有何用?????????
    canvas.height = h; // need to add a note, telling people not to forget to 'appy' before doing anything else.
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
          }, 'image/png'); // todo: add a img quality slider(jpeg only), and allow users to choose file format.
        });
  };

  render() {
    return (
        <div style={BtnWrapperStyle}>
          <button className='img-file-handler-btn' onClick={this.onSave}>Save</button>
        </div>
    )}
}
