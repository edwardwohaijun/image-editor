import React, {Component} from "react";

const VIDEO = 1;
const CANVAS = -1; // when users are switching between canvas and video, just multiply this value by -1
const NO_MEDIA = 0; // video not available yet(or error occurred),
export default class Selfie extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentMedia: NO_MEDIA,
      videoDimension: {width: 800, height: 600},
      error: '', // todo: need to check error, in case users disallow or cameraNotFound, then all btn are disabled
    };

    this.flash = null;
    this.video = null;
    this.canvas = null;
    this.stream = null;
    this.constraints = {
      video: {
        width: {min: 640, ideal: 800},
        height: {min: 480, ideal: 600}, // 1280x720 is good for video streaming, but not for my app. Maybe, add an option for users to select
        aspectRatio: {ideal: 1.7777777778}
      },
      audio: false,
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
    this.setState({currentMedia: -1 * this.state.currentMedia})
  };

  // todo: remove后, 进入canvas, I need to go back to video mode, then take the shot agagin, how to "go back",
  takeShot = () => {
    this.canvas.getContext('2d').drawImage(this.video, 0, 0);
    if (this.state.currentMedia === VIDEO) { // this is to simulate the camera-like flash effect,
      this.toggleFlashCls()
    }
    this.switchView();
  };

  confirmShot = () => {
    console.log("confirmed")
  };

  closeCamera = () => {
    let tracks = this.stream.getTracks();
    tracks.forEach(t => t.stop());
    this.video.srcObject = null;
    this.props.toggleCameraModal()
  };

  toggleFlashCls = () => {
    let clsLs = this.flash.classList;
    if (clsLs.contains('flash')) {
      clsLs.remove('flash')
    } else {
      clsLs.add('flash')
    }
  };

  componentDidMount = () => {
    navigator.getUserMedia(this.constraints,
        stream => {
          this.stream = stream;
          try {
            this.video.src = window.URL.createObjectURL(stream);
          } catch (error) {
            this.video.srcObject = stream;
          }
          this.video.play();
          this.video.onloadedmetadata = () => {
            this.setState({videoDimension: {width: this.video.videoWidth, height: this.video.videoHeight}, currentMedia: VIDEO, error: ''});
          };
        },
        err => { // Most common errors are PermissionDenied and DevicesNotFound.
          // show it on page
          console.error(err);
          this.setState({error: err})
        }
    );
    this.flash.addEventListener("animationend", this.toggleFlashCls)
  };

  componentWillUnmount = () => this.flash.removeEventListener("animationend", this.toggleFlashCls);

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

              <div ref={div => this.flash = div} id='flash' style={{width: videoW + 'px', height: videoH + 'px'}}/>
              <video ref={v => this.video = v} style={{zIndex: 15, position: 'absolute', top: 0}}/>
              <canvas id='camera-canvas' width={videoW + 'px'} height={videoH + 'px'}
                      ref={c => this.canvas = c} style={{zIndex: 10, position: 'absolute', top: 0}}/>

              <div style={{position: 'absolute', height: '48px', width: '100%', bottom: '0', backgroundColor: '#ddd', opacity: 0.3,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: '20'}}>
                <DeleteIcon onClick={this.onClick} currentMedia={this.state.currentMedia}/>
                <CameraIcon onClick={this.onClick} currentMedia={this.state.currentMedia}/>
                <OkIcon onClick={this.onClick} currentMedia={this.state.currentMedia}/>
              </div>
            </div>

          </div>
        </div>
    )}
}

// this is unnecessary...................
const DeleteIcon = props => {
  let m = props.currentMedia;
  let disabled = (m !== CANVAS);
  let cls = 'camera-action ' + (disabled ? 'disabled' : '');
  return (
      <button id='btn-remove-shot' className={cls} onClick={props.onClick} disabled={disabled}>
        <svg xmlns="http://www.w3.org/2000/svg" width="29.8" height="39.98" pointerEvents='none'>
          <path d="M3.49 38.06a2 2 0 0 0 2 1.92h18.8a2 2 0 0 0 2-1.92l1.34-28.32H2.15zm15.66-21.29a.82.82 0 0 1 .83-.77h1.31a.82.82 0 0 1 .82.82V33a.82.82 0 0 1-.82.82h-1.31a.82.82 0 0 1-.81-.82zm-5.72 0a.82.82 0 0 1 .81-.82h1.31a.82.82 0 0 1 .82.82V33a.82.82 0 0 1-.82.82h-1.31a.82.82 0 0 1-.81-.82V16.77zm-5.72 0a.82.82 0 0 1 .81-.77h1.31a.82.82 0 0 1 .82.82V33a.82.82 0 0 1-.82.82H8.52a.82.82 0 0 1-.81-.82zM28.53 2.06h-8.66V.42a.42.42 0 0 0-.42-.42h-9.1a.42.42 0 0 0-.43.42v1.64H1.26A1.26 1.26 0 0 0-.02 3.32v4h29.8v-4a1.27 1.27 0 0 0-1.25-1.26z"/>
        </svg>
      </button>
  )};

const CameraIcon = props => {
  let m = props.currentMedia;
  let disabled = (m === NO_MEDIA);
  let cls = 'camera-action ' + (disabled ? 'disabled' : '');
  return (
      <button id='btn-take-shot' className={cls} onClick={props.onClick} disabled={disabled}>
        <svg xmlns="http://www.w3.org/2000/svg" width="50" height="40" pointerEvents='none'>
          <path fill={m === VIDEO ? "red" : "#030104"}
                d="M25 15a7.5 7.5 0 1 0 7.5 7.5A7.5 7.5 0 0 0 25 15zm20-7.5h-6a2.22 2.22 0 0 1-2-1.42l-1.53-4.66A2.22 2.22 0 0 0 33.5 0h-17a2.23 2.23 0 0 0-2 1.42L13 6.08a2.23 2.23 0 0 1-2 1.42H5a5 5 0 0 0-5 5V35a5 5 0 0 0 5 5h40a5 5 0 0 0 5-5V12.5a5 5 0 0 0-5-5zM25 35a12.5 12.5 0 1 1 12.5-12.5A12.5 12.5 0 0 1 25 35zm18.25-19A1.75 1.75 0 1 1 45 14.25 1.75 1.75 0 0 1 43.25 16z"/>
        </svg>
      </button>
  )};

const OkIcon = props => {
  let m = props.currentMedia;
  let disabled = (m !== CANVAS);
  let cls = 'camera-action ' + (disabled ? 'disabled' : '');
  return (
    <button id='btn-confirm-shot' className={cls} onClick={props.onClick} disabled={disabled}>
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="41.13" pointerEvents='none'>
        <path d="M55.18.82a2.79 2.79 0 0 0-4 0L17.67 34.36 4.78 21.47a2.828 2.828 0 0 0-4 4L15.69 40.3a2.79 2.79 0 0 0 4 0L55.18 4.78a2.81 2.81 0 0 0 0-3.96z"/>
      </svg>
    </button>
)};

const CloseIcon = props => (
    <button id='btn-close-camera' className='camera-action' style={{float: 'right'}} onClick={props.onClick}>
      <svg xmlns="http://www.w3.org/2000/svg" width="30.7" height="30.7" pointerEvents='none'>
        <path d="M26.21 4.49a15.36 15.36 0 1 0 0 21.72 15.37 15.37 0 0 0 0-21.72zm-4.8 16.92a1.18 1.18 0 0 1-1.67 0L15.35 17l-4.59 4.6A1.18 1.18 0 0 1 9.09 20l4.59-4.6L9.3 11A1.202 1.202 0 0 1 11 9.3l4.38 4.38 4.15-4.18a1.18 1.18 0 1 1 1.67 1.67L17 15.35l4.39 4.39a1.18 1.18 0 0 1 .02 1.67z"/>
      </svg>
    </button>
);
