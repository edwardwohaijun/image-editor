//import imgObj from '../common/imgObj';
import React, {Component} from 'react';

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
          <Restore loadImage={this.props.loadImage} onSelectTool={this.props.onSelectTool} />
        </div>
    )}
}

const BtnWrapperStyle = {height: '36px', display: 'flex', alignItems: 'center', position: 'relative'};
// todo: after opening an img, close the dropdown menu
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
  onFileChange = evt => this.props.loadImage(evt.target.files[0]);

  onGoToURL = evt => {
    console.log('evt in gotourl: ', evt.target.parentElement);
    let url = evt.target.parentElement.querySelector('#img-url').value;
    console.log('go to url: ', url);
    // todo: keep the dropdown menu open, while fetching the img, and showing a spinning icon on Go button
    // if succeeded, close the dropdown menu, otherwise, show a failed tip
    // if the url is invalid, also show a failed, just keep it simple.
  };

  onKeyEnter = evt => {
    // todo: check url validity, if not valid, disable the 'Go' button.
    if (evt.key === 'Enter') {
      this.onGoToURL(evt);
      console.log('entered')
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

  render() {
    return (
        <div style={BtnWrapperStyle}>
          <button className='img-file-handler-btn'>Save</button>
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
    this.props.onSelectTool(null) // if there is a tool selected(icon highlighted), unselect it, and the toolPane will move back to original position
  };

  render() {
    return (
        <div style={BtnWrapperStyle}>
          <button onClick={this.restore} className='img-file-handler-btn'>Restore</button>
        </div>
    )}
}
