import React, {Component} from 'react';
import {memory} from "image-editor/image_editor_bg";
import imgObj from '../common/imgObj';
let wasm_img = imgObj.get_wasm_img();

export default class ImgFileHandler extends Component {
  constructor(props) {
    super(props);
    this.state = {
      openDropDown: false,
    };
  }

  componentDidMount = () => { };
  componentDidUpdate = () => { };

  render() {
    return (
        <div style={{display: 'flex', justifyContent: 'space-around', width: '280px', alignItems: 'center'}}>
          <Open resizeCanvas={this.props.resizeCanvas} loadImage={this.props.loadImage}/>
          <Save />
          <Restore loadImage={this.props.loadImage} />
        </div>
    )}
}


const BtnWrapperStyle = {height: '36px', display: 'flex', alignItems: 'center', position: 'relative'};
// todo: close the dropdown menu if user cancel the File dialog without selecting any files
class Open extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownVisible: false
    };
  }

  toggleDropdown = () => this.setState({dropdownVisible: !this.state.dropdownVisible});
  showDropdown = () => this.setState({dropdownVisible: true});
  hideDropdown = () => this.setState({dropdownVisible: false});

  componentDidMount = () => {
    document.addEventListener('click', evt => {
      if (!evt.target.closest('.img-file-handler-btn-wrapper') && this.state.dropdownVisible) {
        this.hideDropdown()
      }
    })
  };

  componentDidUpdate = () => {};

  // to allow to select the same file, otherwise onChange won't get triggered
  onFileClick = evt => evt.target.value = null;
  onFileChange = evt => {
    this.setState({dropdownVisible: false});
    this.props.loadImage(evt.target.files[0]);
  };

  onGoToURL = evt => {
    let url = evt.target.parentElement.querySelector('#img-url').value;
    // todo: keep the dropdown menu open, while fetching the img, and showing a spinning icon on Go button
    // if succeeded, close the dropdown menu, otherwise, show a failed tip
    // if the url is invalid, also show a failed, just keep it simple.
  };

  onKeyEnter = evt => {
    // todo: check url validity, if not valid, disable the 'Go' button.
    if (evt.key === 'Enter') {
      this.onGoToURL(evt);
    }
  };

  render() {
    return (
        <div style={BtnWrapperStyle} className='img-file-handler-btn-wrapper'>
          <div>
            <button onClick={this.toggleDropdown} className='img-file-handler-btn'>Open</button>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="8" className='svg-down-arrow' >
              <path fill="#CCC" d="M7.19 7.54L0 .34.34 0l6.85 6.85L14.04 0l.34.34-7.19 7.2z"/>
            </svg>
          </div>
          {
            !this.state.dropdownVisible ? null :
                <ul className='dropdown-menu'>
                  <li>
                    <label className='clickable'>Computer
                      <input type='file' accept='image/jpeg, image/png' onChange={this.onFileChange} onClick={this.onFileClick} style={{display: 'none'}}/>
                    </label>
                  </li>
                  <li>
                    {/* invoke  evt handler for the following input: pressing ENTER is the same as  */}
                    <input id='img-url' placeholder='Remote URL' onKeyUp={this.onKeyEnter}/>
                    <button className='primary-btn apply-btn' onClick={this.onGoToURL}
                            style={{color: '#ededed', marginLeft: '12px', height: '24px', width: '48px', fontSize: '15px'}}>Go</button>
                  </li>
                  <li id='wonder-woman.jpg'>This site: /img/wonder-woman</li>
                  <li id='Avengers1.jpg'>This site: /img/Avengers</li>
                  <li id='Avengers2.jpg'>This site: /img/Whatever</li>
                  {/* <li>Camera</li> */}
                </ul>
          }
        </div>
    )}
}

class Save extends Component {
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
          }, 'image/png'); // todo: add a img quality slider
        });
  };

  render() {
    return (
        <div style={BtnWrapperStyle}>
          <button className='img-file-handler-btn' onClick={this.onSave}>Save</button>
        </div>
    )}
}

class Restore extends Component { // restore to original state(the moment img get loaded)
  constructor(props) {
    super(props);
    this.state = {}
  }

  componentDidMount = () => {};
  componentDidUpdate = () => {};
  restore = () => {
    this.props.loadImage();
  };

  render() {
    return (
        <div style={BtnWrapperStyle}>
          <button onClick={this.restore} className='img-file-handler-btn'>Restore</button>
        </div>
    )}
}
