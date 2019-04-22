import React, {Component} from 'react';
import OpenImage from './OpenImage';
import SaveImage from './SaveImage';
import RestoreImage from './RestoreImage';

export default class ImgFileHandler extends Component {
  constructor(props) {
    super(props);
    this.state = { };
  }

  render() {
    return (
        <div style={{display: 'flex', justifyContent: 'space-around', width: '280px', alignItems: 'center'}}>
          <OpenImage resizeCanvas={this.props.resizeCanvas} loadImage={this.props.loadImage}/>
          <SaveImage />
          <RestoreImage loadImage={this.props.loadImage} />
        </div>
    )}
}
