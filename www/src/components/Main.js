import imgObj from './common/imgObj';
import React, {Component} from 'react';
import Header from './Header';
import ToolPane from './ToolPane';
import Footer from './Footer';
import Canvas from './Canvas/index'
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import {setZoomRatio, setWidthHeight} from "../actions";
import {CIRCLE_RADIUS} from '../constants/handler';


class Main extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTool: null,
    };
    this.imgSrc = `${URL_PATH}/img/endgame.jpg`
  }

  onSelectTool = id => this.setState({selectedTool: id});

  resizeCanvas = autoFit => { // "autoFit: true" fit canvas into container without scrollbar
    let wasm_img = imgObj.get_wasm_img();
    let imgWidth = wasm_img.width();
    let imgHeight = wasm_img.height();

    let canvas = document.getElementById('canvas');
    let container = document.getElementById('canvas-container');

    let containerWidth = container.offsetWidth;
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

    // todo: moving handler left/top/width/height into redux, let those handlers respond on changes
    // it's too easy to forget to add the following check after adding a new handlers
    if (this.props.cropHandlersVisible || this.props.pixelateHandlersVisible || this.props.miniHandlersVisible) {
      let handlers = document.getElementById('canvas-handler');
      handlers.style.left = left - CIRCLE_RADIUS + 20 + 'px'; // canvas has 20px margin
      handlers.style.top = top - CIRCLE_RADIUS + 20 + 'px';
      handlers.style.width = newWidth + 2 * CIRCLE_RADIUS + 'px';
      handlers.style.height = newHeight + 2 * CIRCLE_RADIUS + 'px';
    }
  };

  // todo: make this an Redux action
  loadImage = src => {
    if (!src) {
      src = this.imgSrc
    }
    let srcType = 'url'; // todo: check url validity
    // even valid url may fail to get a response, where to call err handler?

    // const imgBlob = await fetch(src).then(resp => resp.blob());
    // const img = await createImageBitmap(imgBlob); // imgBigmap only has width and height props.
    if (src instanceof Blob) { // File is a derivation of Blob, with some extra props: like fileName.
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
        this.setState({selectedTool: null});
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
        this.imgSrc = src;

        // To close the Accordion menu, when new img is opened, or current one is restored.
        // Some img processing component need to create HSI after mounted, \
        // we need to unmount those component when new img is loaded(or restored), otherwise, new img still use old img's HSI
        // this line should be at the end of img.onload, otherwise, drawImage would still use the old one, weird!!!
        this.setState({selectedTool: null})
      }
    } else {
      // return
    }
  };

  drawImage = img => { // this is called only when the app is loaded, or img restored(by clicking the restore btn)
  // we need to reset everything, clear canvasHandler, ....
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    imgObj.imgBuff = img;
    let wasm_img = imgObj.get_wasm_img();

    // at the end of this fn, there is a resizeCanvas() call, which will set canvasWidth/Height, which will make the canvas black.
    // In other word, setting canvasWidth/Height must be followed by drawImage(),
    // so I have to schedule the drawImage() to run after resizeCanvas() by using dirty, hacky setTimeout.
    let canvas = document.getElementById('canvas');
    setTimeout(() => canvas.getContext('2d').drawImage(img, 0, 0), 0);

    // ImageData in above canvas is ratio applied(the above resizeCanvas() will change canvas.width/height ), thus, can't feed this imageData into wasm
    // I have to create another tmp canvas to get the original imgData
    let tmpCanvas = document.createElement('canvas');
    let tmpCtx = tmpCanvas.getContext('2d');
    tmpCanvas.width = w;
    tmpCanvas.height = h;
    tmpCtx.drawImage(img, 0, 0);
    let imgData = tmpCtx.getImageData(0, 0, w, h); // imgData has width/height/data props
    wasm_img.reuse(w, h, imgData.data);

    this.resizeCanvas(true); // this must be called when wasm_img is ready(width/height, img_data all are ready), thus we put it at the end of this fn
  };

  render() {
    let canvasParentStyle = {width: '100%', backgroundColor: '#1e2025'};
    canvasParentStyle.transform = this.state.selectedTool == null ? 'translate(0px, 0px)' : 'translate(250px, 0px)';
    let containerWidth = this.state.selectedTool == null ? "calc(100vw - 76px)" : "calc(100vw - 332px)";
    return (
        <div>
          <Header resizeCanvas={this.resizeCanvas} loadImage={this.loadImage} />
          <div style={{display: 'flex', position: 'relative', zIndex: '50',  bottom: '0px', width: '100%'}}>
            <ToolPane onSelectTool={this.onSelectTool} selectedTool={this.state.selectedTool} loadImage={this.loadImage}/>
            <div style={canvasParentStyle} id='canvas-parent'>
              <Canvas resizeCanvas={this.resizeCanvas} loadImage={this.loadImage} containerWidth={containerWidth}/>
              <Footer resizeCanvas={this.resizeCanvas}/>
            </div>
          </div>
        </div>
    )}
}

const mapStateToProps = state => ({
      zoomRatio: state.imgStat.get('zoomRatio'),
      cropHandlersVisible: state.cropHandlersVisible,
      pixelateHandlersVisible: state.pixelateHandlers.get('visible'),
      miniHandlersVisible: state.miniHandlers.get('visible'),
});
const mapDispatchToProps = dispatch => bindActionCreators({setZoomRatio, setWidthHeight}, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Main);
