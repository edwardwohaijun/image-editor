import imgObj from './common/imgObj';
import React, {Component} from 'react';
import Header from './Header';
import ToolPane from './ToolPane';
import Footer from './Footer';
import Canvas from './Canvas/index'
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import {setZoomRatio, setWidthHeight} from "../actions";

class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTool: null,
    };
    // this.imgSrc = '/img/wonder-woman.jpg';
    this.imgSrc = '/img/len_full.jpg';
  }

  onSelectTool = id => this.setState({selectedTool: id});

  resizeCanvas = autoFit => { // "autoShrink: true" fit canvas into container without scrollbar
    let wasm_img = imgObj.get_wasm_img();
    let imgWidth = wasm_img.width();
    let imgHeight = wasm_img.height();

    let canvas = document.getElementById('canvas');
    let container = document.getElementById('canvas-container');

    let containerWidth = container.offsetWidth;  // clientWidth;
    let containerHeight = container.offsetHeight;// clientHeight;
    let zoomRatio = 1.0;
    if (!autoFit) { // users manually zoom-in/out canvas
      zoomRatio = this.props.zoomRatio
    }

    let paddedHeight = containerHeight * 0.9;
    let paddedWidth = containerWidth * 0.9;

    if (autoFit) {
      if (paddedWidth >= imgWidth && paddedHeight >= imgHeight) { // both weight/height can fit in 90% of canvas container
        zoomRatio = 1.0
      } else {
        zoomRatio = Math.min(paddedWidth / imgWidth, paddedHeight / imgHeight) // either width or height is too bigger to fit .....
      }
    }

    if (autoFit) {
    // "true" is triggered when page get loaded, we need to set zoomRatio
    // "false" is triggered by clicking the zoom-in/out button, that click handler already run setZoomRatio().
      this.props.setZoomRatio(zoomRatio);
    }

    let newWidth = Math.round(imgWidth * zoomRatio);
    let newHeight = Math.round(imgHeight * zoomRatio);
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      // setting canvas.width/height will clear the canvas(make it black), even the width/height values don't change.
      canvas.width = newWidth;
      canvas.height = newHeight;
      let ctx = canvas.getContext('2d');
      ctx.scale(zoomRatio, zoomRatio);
    }

    let left = Math.round(Math.max(0, containerWidth - newWidth) / 2);
    let top = Math.round(Math.max(0, containerHeight - newHeight) / 2);
    canvas.style.left = left + 'px';
    canvas.style.top = top + 'px';

    if (this.props.cropHandlersVisible) {
      let handlers = document.getElementById('canvas-handler');
      handlers.style.left = left - 9 + 20 + 'px'; // 9 is imgHandler's radius, canvas has 20px margin
      handlers.style.top = top - 9 + 20 + 'px';
      handlers.style.width = newWidth + 18 + 'px';
      handlers.style.height = newHeight + 18 + 'px';
    }
  };

  componentDidMount = () => { };
  componentDidUpdate = () => { };

  loadImage = src => { // todo: use fetch(), then read as blob, rather than base64
    if (!src) {
      src = this.imgSrc
    }
    let srcType = 'url'; // todo: check url validity
    // even valid url may fail to get a response, where to call err handler?

    // const imgBlob = await fetch(src).then(resp => resp.blob());
    // const img = await createImageBitmap(imgBlob); // imgBigmap only has width and height props.
    if (src instanceof File) {
      if (!src.type.match('image.*')) {
        return // todo: pop up a msg
      }
      srcType = 'file'
    }

    let img = new Image();
    if (srcType === 'url') {
      img.src = src;
      img.onload = () => { // img is base64, consider using fetch to get the blob, then feed directly to wasm
        this.props.setWidthHeight({width: img.naturalWidth, height: img.naturalHeight});
        this.drawImage(img);
        this.imgSrc = src;
      };
    } else if (srcType === 'file') {
      let reader = new FileReader();
      reader.readAsDataURL(src); // img is base64 format, consider using FileReader.readAsArrayBuffer(), then feed directly to wasm
      reader.onload = evt => {
        img.src = evt.target.result;
      };
      img.onload = () => {
        this.props.setWidthHeight({width: img.naturalWidth, height: img.naturalHeight});
        this.drawImage(img);
        this.imgSrc = src
      }
    } else {
      return
    }
  };

  drawImage = img => { // this is called only when the app is loaded, or img restored(by clicking the restore btn)
  // we need to reset everything, clear canvasHandler, ....
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    imgObj.imgBuff = img;
    let wasm_img = imgObj.get_wasm_img();
    wasm_img.reuse(w, h, new Uint8Array(2)); // resizeCanvas call need width/height in wasm_img, but the img data(3rd arg) is not ready, just pass a dummy data to it.
    this.resizeCanvas(true); // this must be called when wasm_img is ready.

    let canvas = document.getElementById('canvas');
    canvas.getContext('2d').drawImage(img, 0, 0);

    // ImageData in above canvas is ratio applied(the above resizeCanvas() will change canvas.width/height ), thus, can't feed this imageData into wasm
    // I have to create another tmp canvas to get the original imgData
    let tmpCanvas = document.createElement('canvas');
    let tmpCtx = tmpCanvas.getContext('2d');
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    tmpCtx.drawImage(img, 0, 0);
    let imgData = tmpCtx.getImageData(0, 0, w, h); // imgData has width/height/data props
    wasm_img.reuse(w, h, imgData.data);
  };

  render() {
    let canvasParentStyle = {width: '100%', backgroundColor: '#1e2025'};
    canvasParentStyle.transform = this.state.selectedTool == null ? 'translate(0px, 0px)' : 'translate(250px, 0px)';
    return (
        <div>
          <Header resizeCanvas={this.resizeCanvas} loadImage={this.loadImage} onSelectTool={this.onSelectTool}/>
          <div style={{display: 'flex', position: 'relative', zIndex: '50',  bottom: '0px', width: '100%'}}>
            <ToolPane onSelectTool={this.onSelectTool} selectedTool={this.state.selectedTool}/>
            <div style={canvasParentStyle} id='canvas-parent'>
              <Canvas resizeCanvas={this.resizeCanvas} loadImage={this.loadImage} />
              <Footer resizeCanvas={this.resizeCanvas}/>
            </div>
          </div>
        </div>
    )}
}

const mapStateToProps = state => ({
      zoomRatio: state.imgStat.get('zoomRatio'),
      cropHandlersVisible: state.cropHandlersVisible,
      //scaleHandlersVisible: state.scaleHandlersVisible
});
const mapDispatchToProps = dispatch => bindActionCreators({setZoomRatio, setWidthHeight}, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Main);
