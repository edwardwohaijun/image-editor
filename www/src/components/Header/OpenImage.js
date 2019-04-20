import React, {Component} from 'react';

const BtnWrapperStyle = {height: '36px', display: 'flex', alignItems: 'center', position: 'relative'};
// todo: close the dropdown menu if user cancel the File dialog without selecting any files
export default class OpenImage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownVisible: false,
      openCamera: false,
    };
  }

  toggleDropdown = () => this.setState({dropdownVisible: !this.state.dropdownVisible});
  showDropdown = () => this.setState({dropdownVisible: true});
  hideDropdown = () => this.setState({dropdownVisible: false});

  componentDidMount = () => {
    document.addEventListener('click', evt => {
      if (!evt.target.closest('.img-file-handler-btn-wrapper') && this.state.dropdownVisible) {
        this.hideDropdown();
      }

      if (evt.target.classList.contains('test-image')) {
        this.props.loadImage(evt.target.id);
        this.hideDropdown()
      }
    });
  };

  componentDidUpdate = () => {};

  // to allow to select the same file, otherwise onChange won't get triggered
  onFileClick = evt => evt.target.value = null;
  onFileChange = evt => {
    this.setState({dropdownVisible: false});
    let file = evt.target.files[0];
    // setTimeout(() => this.props.loadImage(file, 2000));
    this.props.loadImage(file)
  };

  toggleCameraModal = () => this.setState({openCamera: !this.state.openCamera});

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
                  <li className='clickable' onClick={this.toggleCameraModal}>Camera</li>
                  <li>
                    {/* invoke evt handler for the following input: pressing ENTER is the same as  */}
                    <input id='img-url' placeholder='Remote URL' onKeyUp={this.onKeyEnter}/>
                    <button className='primary-btn apply-btn' onClick={this.onGoToURL}
                            style={{color: '#ededed', marginLeft: '12px', height: '24px', width: '48px', fontSize: '15px'}}>Go</button>
                  </li>
                  <li className='test-image clickable' id='/img/JusticeLeague/wonder-woman.jpg'>DC/wonder-woman</li>
                  <li className='test-image clickable' id='/img/Avengers/endgame.png'>Avengers/endgame</li>
                  <li className='test-image clickable' id='/img/edgesPreservingDenoise/EmmaStone1.jpg'>Emma Stone 1 (remove freckles)</li>
                  <li className='test-image clickable' id='/img/edgesPreservingDenoise/EmmaStone2.jpg'>Emma Stone 2 (remove freckles)</li>
                  <li className='test-image clickable' id='/img/edgesPreservingDenoise/EddieRedmayne.jpg'>Eddie Redmayne (remove freckles)</li>
                  <li className='test-image clickable' id='/img/TrueBlood.jpg'>True Blood (temperature adjust)</li>
                  <li className='test-image clickable' id='/img/lowContrast/kitty.jpg'>Kitty (Low contrast)</li>
                  <li className='test-image clickable' id='/img/lowContrast/forest.jpg'>Forest (low contrast - too dark)</li>

                </ul>
          }
          {this.state.openCamera ? <Selfie toggleCameraModal={this.toggleCameraModal}/> : null}
        </div>
    )}
}

// https://googlechrome.github.io/samples/image-capture/grab-frame-take-photo.html
// https://stackoverflow.com/questions/33975431/how-can-i-capture-an-image-via-the-users-webcam-using-getusermedia
// https://www.jonathan-petitcolas.com/2016/08/24/taking-picture-from-webcam-using-canvas.html
// https://blog.prototypr.io/make-a-camera-web-app-tutorial-part-1-ec284af8dddf
// https://codepen.io/ekrof/pen/yOrPwv
// https://github.com/mdn/samples-server/blob/master/s/webrtc-capturestill/capture.js
// https://gist.github.com/anantn/1852070
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Taking_still_photos
// https://www.html5rocks.com/en/tutorials/getusermedia/intro/
// https://developers.google.com/web/fundamentals/media/capturing-images/
// https://tutorialzine.com/2016/07/take-a-selfie-with-js
// create a modal dialog like this one, with 3 buttons: delete, take-selfie, I need another canvas to save the img for users to take action
// if you are satisfied, I'd copy the img to editing canvs, if not, you can take another one.

class Selfie extends Component {
  constructor(props) {
    super(props);
    this.state = {
      videoVisible: true, // either video or canvas is shown
      videoDimension: {width: 800, height: 600},
      error: '', // todo: need to check error, in case users disallow or cameraNotFound, then all btn are disabled
    };

    this.video = null;
    this.canvas = null;
    this.stream = null;
    this.videoConstraints = {
      width: {min: 640, ideal: 800},
      height: {min: 480, ideal: 600}, // 1280x720 is good for video streaming, but not for my app
      aspectRatio: {ideal: 1.7777777778}
    };
    this.op = {
      'btn-remove-shot': this.switchView,
      'btn-take-shot': this.takeShot,
      'btn-confirm-shot': this.confirmShot,
      'btn-close-camera': this.closeCamera
    }
  }

  switchView = () => {
    let video_zidx = this.video.style.zIndex;
    let canvas_zidx = this.canvas.style.zIndex;
    this.video.style.zIndex = canvas_zidx;
    this.canvas.style.zIndex = video_zidx;
  };

  // todo: remove后, 进入canvas, I need to go back to video mode, then take the shot agagin, how to "go back",  
  takeShot = () => {
    this.canvas.getContext('2d').drawImage(this.video, 0, 0);
    this.switchView();
  };

  confirmShot = () => {
    console.log("confirmed")
  };

  closeCamera = () => {
    this.stream.getTracks()[0].stop();
    this.props.toggleCameraModal()
  };

  componentDidMount = () => {

    navigator.getUserMedia({video: this.videoConstraints},
        stream => {
          this.stream = stream;
          try {
            this.video.src = window.URL.createObjectURL(stream);
          } catch (error) {
            this.video.srcObject = stream;
          }
          this.video.play();
          this.video.onloadedmetadata = () => {
            this.setState({videoDimension: {width: this.video.videoWidth, height: this.video.videoHeight}});
          };
          /*
          let width = stream.getVideoTracks()[0].getSettings().width;
          let height = stream.getVideoTracks()[0].getSettings().height;
          */
        },
        err => { // Most common errors are PermissionDenied and DevicesNotFound.
          // show it on page
          console.error(err);
        }
    );

  };

  componentDidUpdate = () => {};

  onClick = evt => {
    let btnID = evt.target.id;
    this.op[btnID]()
  };

  render() {
    let videoW = this.state.videoDimension.width;
    let videoH = this.state.videoDimension.height;
    return (
        <div id='modal-camera'>
          <div id='selfie-wrapper' style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>

            <div style={{position: 'absolute', width: videoW + 'px', height: videoH + 'px'}}>
              <div style={{position: 'relative', height: '34px', top: '6px', width: '100%', zIndex: 20}}>
                <CloseIcon onClick={this.onClick}/>
              </div>

              <video ref={v => this.video = v} style={{zIndex: 15, position: 'absolute', top: 0}}/>
              <canvas id='camera-canvas' width={videoW + 'px'} height={videoH + 'px'} ref={c => this.canvas = c} style={{zIndex: 10, position: 'absolute', top: 0}}/>

              <div style={{position: 'absolute', height: '48px', width: '100%', bottom: '0', backgroundColor: '#ddd', opacity: 0.3,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: '20'}}>
                <DeleteIcon onClick={this.onClick}/>
                <CameraIcon onClick={this.onClick}/>
                <OkIcon onClick={this.onClick}/>
              </div>
            </div>

          </div>
        </div>
    )}
}

const DeleteIcon = props => (
    <button id='btn-remove-shot' className='camera-action' onClick={props.onClick}>
      <svg xmlns="http://www.w3.org/2000/svg" width="29.8" height="39.98" pointerEvents='none'>
        <path d="M3.49 38.06a2 2 0 0 0 2 1.92h18.8a2 2 0 0 0 2-1.92l1.34-28.32H2.15zm15.66-21.29a.82.82 0 0 1 .83-.77h1.31a.82.82 0 0 1 .82.82V33a.82.82 0 0 1-.82.82h-1.31a.82.82 0 0 1-.81-.82zm-5.72 0a.82.82 0 0 1 .81-.82h1.31a.82.82 0 0 1 .82.82V33a.82.82 0 0 1-.82.82h-1.31a.82.82 0 0 1-.81-.82V16.77zm-5.72 0a.82.82 0 0 1 .81-.77h1.31a.82.82 0 0 1 .82.82V33a.82.82 0 0 1-.82.82H8.52a.82.82 0 0 1-.81-.82zM28.53 2.06h-8.66V.42a.42.42 0 0 0-.42-.42h-9.1a.42.42 0 0 0-.43.42v1.64H1.26A1.26 1.26 0 0 0-.02 3.32v4h29.8v-4a1.27 1.27 0 0 0-1.25-1.26z"/>
      </svg>
    </button>
);

const CameraIcon = props => (
    <button id='btn-take-shot' className='camera-action' onClick={props.onClick}>
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="40" pointerEvents='none'>
        <path d="M25 15a7.5 7.5 0 1 0 7.5 7.5A7.5 7.5 0 0 0 25 15zm20-7.5h-6a2.22 2.22 0 0 1-2-1.42l-1.53-4.66A2.22 2.22 0 0 0 33.5 0h-17a2.23 2.23 0 0 0-2 1.42L13 6.08a2.23 2.23 0 0 1-2 1.42H5a5 5 0 0 0-5 5V35a5 5 0 0 0 5 5h40a5 5 0 0 0 5-5V12.5a5 5 0 0 0-5-5zM25 35a12.5 12.5 0 1 1 12.5-12.5A12.5 12.5 0 0 1 25 35zm18.25-19A1.75 1.75 0 1 1 45 14.25 1.75 1.75 0 0 1 43.25 16z" fill="#030104"/>
      </svg>
    </button>
);

const OkIcon = props => (
    <button id='btn-confirm-shot' className='camera-action' onClick={props.onClick}>
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="41.13" pointerEvents='none'>
        <path d="M55.18.82a2.79 2.79 0 0 0-4 0L17.67 34.36 4.78 21.47a2.828 2.828 0 0 0-4 4L15.69 40.3a2.79 2.79 0 0 0 4 0L55.18 4.78a2.81 2.81 0 0 0 0-3.96z"/>
      </svg>
    </button>
);

const CloseIcon = props => (
    <button id='btn-close-camera' className='camera-action' style={{float: 'right'}} onClick={props.onClick}>
      <svg xmlns="http://www.w3.org/2000/svg" width="30.7" height="30.7" pointerEvents='none'>
        <path d="M26.21 4.49a15.36 15.36 0 1 0 0 21.72 15.37 15.37 0 0 0 0-21.72zm-4.8 16.92a1.18 1.18 0 0 1-1.67 0L15.35 17l-4.59 4.6A1.18 1.18 0 0 1 9.09 20l4.59-4.6L9.3 11A1.202 1.202 0 0 1 11 9.3l4.38 4.38 4.15-4.18a1.18 1.18 0 1 1 1.67 1.67L17 15.35l4.39 4.39a1.18 1.18 0 0 1 .02 1.67z"/>
      </svg>
    </button>
)