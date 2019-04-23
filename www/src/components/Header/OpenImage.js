import React, {Component} from 'react';
import Selfie from './Selfie';

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
  
  // to allow to select the same file, otherwise onChange won't get triggered
  onFileClick = evt => evt.target.value = null;
  onFileChange = evt => {
    this.setState({dropdownVisible: false});
    let file = evt.target.files[0];
    this.props.loadImage(file)
  };

  toggleCameraModal = () => this.setState({openCamera: !this.state.openCamera, dropdownVisible: false});

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
                  {/*<li>
                    <input id='img-url' placeholder='Remote URL' onKeyUp={this.onKeyEnter}/>
                    <button className='primary-btn apply-btn' onClick={this.onGoToURL}
                            style={{color: '#ededed', marginLeft: '12px', height: '24px', width: '48px', fontSize: '15px'}}>Go</button>
                  </li>*/}
                  <li className='test-image clickable' id={`${URL_PATH}/img/wonder-woman.jpg`}>wonder-woman</li>
                  <li className='test-image clickable' id={`${URL_PATH}/img/endgame.jpg`}>Avengers: endgame</li>
                  <li className='test-image clickable' id={`${URL_PATH}/img/TrueBlood.jpg`}>True Blood (temperature adjust)</li>
                  <li className='test-image clickable' id={`${URL_PATH}/img/kitty.jpg`}>Kitty (Low contrast - too bright)</li>
                  <li className='test-image clickable' id={`${URL_PATH}/img/forest.jpg`}>Forest (low contrast - too dark)</li>
                </ul>
          }
          {this.state.openCamera ? <Selfie loadImage={this.props.loadImage} toggleCameraModal={this.toggleCameraModal}/> : null}
        </div>
    )}
}
