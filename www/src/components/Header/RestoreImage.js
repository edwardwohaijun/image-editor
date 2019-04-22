import React, {Component} from 'react';

const BtnWrapperStyle = {height: '36px', display: 'flex', alignItems: 'center', position: 'relative'};
export default class Restore extends Component { // restore to original state(the moment img get loaded)
  constructor(props) {
    super(props);
    this.state = {}
  }

  restore = () => this.props.loadImage();

  render() {
    return (
        <div style={BtnWrapperStyle}>
          <button onClick={this.restore} className='img-file-handler-btn'>Restore</button>
        </div>
    )}
}
