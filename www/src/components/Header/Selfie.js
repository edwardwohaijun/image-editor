import React, {Component} from "react";

const VIDEO = 1;
const CANVAS = -1; // when users are switching between canvas and video, just multiply this value by -1
const NO_MEDIA = 0; // video not available yet(or error occurred),
const FILTERS = [
  {label: 'NONE', f: ''}, {label: 'invert', f: 'invert(0.8)'}, {label: 'grayscale', f: 'grayscale(1)'},
  {label: 'saturate', f: 'saturate(6)'}, {label: 'sepia', f: 'sepia(1)'}, {label: 'blur', f: 'blur(5px)'},
  {label: 'brightness', f: 'brightness(5)'}, {label: 'contrast', f: 'contrast(5)'},
  {label: 'hue-rotate-Hulk', f: 'hue-rotate(90deg)'}, {label: 'hue-rotate-Avatar', f: 'hue-rotate(180deg)'}, {label: 'hue-rotate-Thanos', f: 'hue-rotate(270deg)'},
]; // these filters can be combined to create combo effects.

export default class Selfie extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentMedia: NO_MEDIA,
      videoDimension: {width: 800, height: 600},
      error: false,
      showFilterList: false,
      activeFilterIdx: 0,
    };

    this.flash = null;
    this.video = null;
    this.canvas = null;
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
      'btn-close-camera': this.closeCamera,
    }
  }

  switchView = () => {
    let video_zidx = this.video.style.zIndex;
    let canvas_zidx = this.canvas.style.zIndex;
    this.video.style.zIndex = canvas_zidx;
    this.canvas.style.zIndex = video_zidx;
    this.setState({currentMedia: -1 * this.state.currentMedia})
  };

  takeShot = () => {
    let ctx = this.canvas.getContext('2d');
    let idx = this.state.activeFilterIdx;

    if (typeof ctx.filter !== "undefined" && idx !== 0) {
      ctx.filter = FILTERS[idx].f;
    }
    ctx.drawImage(this.video, 0, 0);
    if (this.state.currentMedia === VIDEO) { // this is to simulate the camera-like flash effect,
      this.toggleFlashCls()
    }
    this.switchView();
  };

  confirmShot = () => {
    this.canvas.toBlob(blob => { // toDataURL failed for big canvas
      this.props.loadImage(blob);
      this.closeCamera()
    }, 'image/png');
  };

  closeCamera = () => {
    let stream = this.video.srcObject;
    if (stream) {
      let tracks = stream.getTracks();
      tracks.forEach(t => t.stop());
      this.video.srcObject = null;
    }
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
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      this.setState({error: true});
      return
    }

    navigator.mediaDevices.getUserMedia(this.constraints)
        .then(stream => {
          this.video.srcObject = stream;
          this.video.onloadedmetadata = () => {
            this.setState({videoDimension: {width: this.video.videoWidth, height: this.video.videoHeight}, currentMedia: VIDEO, error: false});
          };
        })
        .catch(err => {
          console.error("error acquiring video stream: ", err);
          this.setState({error: true})
        });

    this.flash.addEventListener("animationend", this.toggleFlashCls);
    document.addEventListener('click', this.toggleFilterList)
  };

  componentWillUnmount = () => {
    this.flash.removeEventListener("animationend", this.toggleFlashCls);
    document.removeEventListener('click', this.toggleFilterList)
  };

  onClick = evt => {
    let btnID = evt.target.id;
    this.op[btnID]()
  };

  selectFilter = evt => {
    this.setState({activeFilterIdx: parseInt(evt.target.dataset.filterIdx)})
    // let idx= evt.target.dataset.filterIdx;
    // let activeFilter = FILTERS[idx];
    // this.setState({activeFilter})
  };

  toggleFilterList = evt => {
    let filterWrapper = evt.target.closest('#video-filter-wrapper');
    if (!filterWrapper && this.state.showFilterList) { // click evt happened outside the filterList, close it if opened
      this.setState({showFilterList: false});
    } else if (filterWrapper) {
      this.setState({showFilterList: !this.state.showFilterList});
    }
  };

  render() {
    let videoW = this.state.videoDimension.width;
    let videoH = this.state.videoDimension.height;
    let iconVisible = this.state.currentMedia === NO_MEDIA ? 'hidden' : 'visible';
    return (
        <div id='modal-camera'>
          <div id='selfie-wrapper' style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>

            <div style={{position: 'absolute', width: videoW + 'px', height: videoH + 'px'}}>
              <div style={{position: 'relative', height: '34px', top: '6px', width: '100%', zIndex: 20}}>
                <CloseIcon onClick={this.onClick}/>
              </div>

              <div ref={div => this.flash = div} id='flash' style={{width: videoW + 'px', height: videoH + 'px'}}/>
              {
                !this.state.error ? null : <div style={{width: videoW + 'px', height: videoH + 'px', position: 'absolute', top: 0, borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',  backgroundColor: '#FFF'}}>
                  <ErrorMsg />
                </div>
              }
              <video ref={v => this.video = v} style={{filter: FILTERS[this.state.activeFilterIdx].f, zIndex: 15, position: 'absolute', top: 0}} autoPlay />
              <canvas id='camera-canvas' width={videoW + 'px'} height={videoH + 'px'}
                      ref={c => this.canvas = c} style={{zIndex: 10, position: 'absolute', top: 0}}/>

              <div style={{visibility: iconVisible, position: 'absolute', height: '48px', width: '50%', left: videoW/4 + 'px', bottom: '0', backgroundColor: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: '20'}}>
                <FilterIcon selectFilter={this.selectFilter} currentMedia={this.state.currentMedia} activeFilterIdx={this.state.activeFilterIdx}
                            showFilterList={this.state.showFilterList} toggleFilterList={this.toggleFilterList}/>
                <CameraIcon onClick={this.onClick} currentMedia={this.state.currentMedia}/>
                <OkIcon onClick={this.onClick} currentMedia={this.state.currentMedia}/>
              </div>
            </div>

          </div>
        </div>
    )}
}

const CameraIcon = props => {
  let m = props.currentMedia;
  let disabled = (m === NO_MEDIA);
  let cls = 'camera-action ' + (disabled ? 'disabled' : '');
  return (
      <button id='btn-take-shot' className={cls} onClick={props.onClick} disabled={disabled}>
        <svg xmlns="http://www.w3.org/2000/svg" width="35.05" height="35.05" pointerEvents='none'>
          <circle cx="17.52" cy="17.52" r="17.02" fill={m === VIDEO ? "red" : "#387dcd"} stroke="none" strokeMiterlimit="10"/>
          <path fill="#fff" stroke="none" strokeMiterlimit="10" d="M17.54 14.96a3 3 0 1 0 3 3 3 3 0 0 0-3-3zm8-3h-2.39a.9.9 0 0 1-.79-.57l-.62-1.86a.89.89 0 0 0-.79-.57h-6.81a.88.88 0 0 0-.79.57l-.62 1.86a.91.91 0 0 1-.8.57h-2.4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9a2 2 0 0 0-1.97-2zm-8 11a5 5 0 1 1 5-5 5 5 0 0 1-5 5zm7.31-7.62a.7.7 0 1 1 0-1.4.7.7 0 1 1 0 1.4z"/>
        </svg>
      </button>
  )};

const OkIcon = props => {
  let m = props.currentMedia;
  let disabled = (m !== CANVAS);
  let cls = 'camera-action ' + (disabled ? 'disabled' : '');
  return (
    <button id='btn-confirm-shot' className={cls} onClick={props.onClick} disabled={disabled}>
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" pointerEvents='none'>
        <path fill='#387dcd' d="M18 0a18 18 0 1 0 18 18A18 18 0 0 0 18 0zm10 12L17 24.46a1.36 1.36 0 0 1-1 .46 1.39 1.39 0 0 1-.86-.3l-7.01-5.54a1.38 1.38 0 0 1 1.73-2.16l5.9 4.72L26 10.16A1.38 1.38 0 1 1 28 12z"/>
      </svg>
    </button>
  )};

const CloseIcon = props => (
    <button id='btn-close-camera' className='camera-action' style={{float: 'right'}} onClick={props.onClick}>
      <svg xmlns="http://www.w3.org/2000/svg" width="30.7" height="30.7" pointerEvents='none'>
        <path fill='#387dcd' d="M26.21 4.49a15.36 15.36 0 1 0 0 21.72 15.37 15.37 0 0 0 0-21.72zm-4.8 16.92a1.18 1.18 0 0 1-1.67 0L15.35 17l-4.59 4.6A1.18 1.18 0 0 1 9.09 20l4.59-4.6L9.3 11A1.202 1.202 0 0 1 11 9.3l4.38 4.38 4.15-4.18a1.18 1.18 0 1 1 1.67 1.67L17 15.35l4.39 4.39a1.18 1.18 0 0 1 .02 1.67z"/>
      </svg>
    </button>
);

const FilterIcon = props => {
  let m = props.currentMedia;
  let disabled = (m !== VIDEO);
  let cls = 'camera-action ' + (disabled ? 'disabled' : '');
  return (
      <div id='video-filter-wrapper'>
        <button className={cls} disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" width="37.56" height="37.56" pointerEvents='none'>
            <circle cx="18.78" cy="18.78" r="18.28" stroke="none" fill="#387DCD"/>
            <path fill="#FFF" stroke="none" d="M11.51 16.7l.54 1.46a.14.14 0 0 0 .26 0l.54-1.46a4.31 4.31 0 0 1 2.55-2.55l1.47-.54a.15.15 0 0 0 .09-.13.16.16 0 0 0-.09-.14l-1.47-.54a4.31 4.31 0 0 1-2.55-2.55l-.54-1.46a.14.14 0 0 0-.26 0l-.54 1.46a4.3 4.3 0 0 1-2.56 2.55l-1.46.54a.16.16 0 0 0-.09.14.15.15 0 0 0 .09.13l1.46.54a4.3 4.3 0 0 1 2.56 2.55zM23.37 22.88l-1.47-.54a4.33 4.33 0 0 1-2.55-2.56l-.54-1.46a.14.14 0 0 0-.26 0l-.54 1.46a4.33 4.33 0 0 1-2.55 2.56l-1.47.54a.14.14 0 0 0 0 .26l1.47.54a4.34 4.34 0 0 1 2.55 2.55l.57 1.47a.14.14 0 0 0 .26 0l.54-1.47a4.34 4.34 0 0 1 2.55-2.55l1.47-.54a.14.14 0 0 0 0-.26zM30.94 16.62l-1-.36a2.94 2.94 0 0 1-1.73-1.74l-.37-1a.1.1 0 0 0-.09-.07.11.11 0 0 0-.09.07l-.36 1a3 3 0 0 1-1.74 1.74l-1 .36a.11.11 0 0 0-.07.09.1.1 0 0 0 .07.09l1 .37a2.94 2.94 0 0 1 1.74 1.73l.36 1a.11.11 0 0 0 .09.06.1.1 0 0 0 .09-.06l.37-1a2.9 2.9 0 0 1 1.73-1.73l1-.37a.1.1 0 0 0 .06-.09.11.11 0 0 0-.06-.09zM28.58 29.71l-.69-.26a2 2 0 0 1-1.21-1.21l-.26-.69a.06.06 0 0 0-.06-.05.06.06 0 0 0-.06.05l-.26.69a2.06 2.06 0 0 1-1.26 1.26l-.69.26a.06.06 0 0 0 0 .12l.69.26a2 2 0 0 1 1.21 1.21l.26.69a.06.06 0 0 0 .06 0 .06.06 0 0 0 .06 0l.26-.69a2 2 0 0 1 1.21-1.21l.69-.26a.07.07 0 0 0 0-.12zM23.42 9.77l-.7-.25a2.06 2.06 0 0 1-1.21-1.21l-.25-.7a.08.08 0 0 0-.07 0 .08.08 0 0 0-.06 0l-.25.7a2.05 2.05 0 0 1-1.22 1.19l-.69.25a.08.08 0 0 0 0 .06.08.08 0 0 0 0 .07l.69.25a2.05 2.05 0 0 1 1.22 1.21l.25.7a.08.08 0 0 0 .06 0 .08.08 0 0 0 .07 0l.25-.7a2.06 2.06 0 0 1 1.21-1.21l.7-.25a.08.08 0 0 0 0-.06.08.08 0 0 0 0-.05zM14.91 28.28l-.87-.32a2.57 2.57 0 0 1-1.52-1.52l-.33-.87a.07.07 0 0 0-.07-.06.08.08 0 0 0-.08.06l-.32.87a2.58 2.58 0 0 1-1.53 1.52l-.87.32a.09.09 0 0 0 0 .08.08.08 0 0 0 0 .08l.87.32a2.58 2.58 0 0 1 1.53 1.52l.32.88a.08.08 0 0 0 .08.05.08.08 0 0 0 .07-.05l.33-.88a2.57 2.57 0 0 1 1.52-1.52l.87-.32a.09.09 0 0 0 .06-.08.1.1 0 0 0-.06-.08z"/>
          </svg>
        </button>
        {!props.showFilterList ? null : <FilterList selectFilter={props.selectFilter} activeFilterIdx={props.activeFilterIdx}/>}
      </div>
  )};

const FilterList = props => {
  return (
      <ul onClick={props.selectFilter} className='dropdown-menu video-filter-list' style={{bottom: '32px', width: '168px', top: 'unset', left: 'unset'}}>
        {FILTERS.map((f, idx) =>
            <li key={idx} data-filter-idx={idx} className={'clickable ' + (idx === props.activeFilterIdx ? 'active' : '')}>
              <span data-filter-idx={idx}>{f.label}</span>
            </li>
        )}
      </ul>
  )
};

const ErrorMsg = () =>
    <div>
      <h1>Possible reasons for this error</h1>
      <ul>
        <li>Your browser is too old, please use latest version of <a target='_blank' href='https://www.google.com/chrome/'>Chrome</a>
           or <a target='_blank' href='https://www.mozilla.org/en-US/firefox/new/'>Firefox</a>.</li>
        <li>You don't have any cameras plugged in.</li>
        <li>You need to grant permission to use your camera, like the following screenshot shows:</li>
      </ul>
      <img src={`${URL_PATH}/img/permissionDialog.jpg`}/>
    </div>;
