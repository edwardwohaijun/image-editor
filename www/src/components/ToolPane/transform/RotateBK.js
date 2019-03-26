// flip-h/v, rotate 90/180(other degrees to be add later), shrea
// scale up/down
import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import icons from './buttonIcons';

export default class Rotate extends Component {
  constructor(props) {
    super(props);
    this.imgObj = imgObj.getImgObj();
    this.state = {
      //selected
    }
  }

  componentDidMount = () => { };
  componentDidUpdate = prevProps => { };
  componentWillUnmount = () => { };

  onClick = evt => {
    switch (evt.target.id) {
      case 'btn_rotate_counter_clockwise': this.imgObj.rotate(false); break;
      case 'btn_rotate_clockwise': this.imgObj.rotate(true); break;
      case 'btn_flip_h': this.imgObj.flip_h(); break;
      case 'btn_flip_v': this.imgObj.flip_v(); break;
    }
    this.props.redraw()
  };

  render() {
    let svgStyle = this.props.selectedTool === 'transform-rotate' ? {transform: 'rotate(180deg)'} : {transform: 'rotate(0deg)'};
    return (
        <div className='editor-header-wrapper'>
          <div id='transform-rotate' className='editor-header' onClick={this.props.onSelectTool}>
            <span>ROTATE</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="8" className='svg-down-arrow' style={svgStyle}>
              <path fill="#CCC" d="M7.19 7.54L0 .34.34 0l6.85 6.85L14.04 0l.34.34-7.19 7.2z"/>
            </svg>
          </div>
          {
            this.props.selectedTool !== 'transform-rotate' ? null :
                <div>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <button className='editor-btn' id='btn_rotate_counter_clockwise' onClick={this.onClick}>
                      {icons.rotate_counter_clockwise}
                    </button>
                    <button className='editor-btn' id="btn_rotate_clockwise" onClick={this.onClick}>
                      {icons.rotate_clockwise}
                    </button>
                    <button className='editor-btn' id="btn_flip_h" onClick={this.onClick}>
                      {icons.flip_horizontal}
                    </button>
                    <button className='editor-btn' id="btn_flip_v" onClick={this.onClick}>
                      {icons.flip_vertical}
                    </button>
                  </div>
          </div>
          }
        </div>
    )}
}
