import React, {Component} from 'react';
import ModeSwitcher from './ModeSwitcher';
import ImgFileHandler from './ImgFileHandler';
import Account from './Account';

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
        <div style={{width: '100%', height: '56px', display: 'flex', zIndex: '100', position: 'relative', justifyContent: 'space-between', backgroundColor: '#373842', boxShadow: '0 0 0.5rem rgba(0,0,0,.8)'}}>
          <ModeSwitcher/>
          <ImgFileHandler resizeCanvas={this.props.resizeCanvas} loadImage={this.props.loadImage} />
          <Account/>
        </div>
    )}
}

export default Header;
