import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import icons from './buttonIcons';
import {bindActionCreators} from "redux";
import {setWidthHeight} from "../../../actions";
import {connect} from "react-redux";

class Rotate extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = { };
    this.op = {
      'rotate_counter_clockwise': () => {
        this.props.setWidthHeight({width: props.imgHeight, height: props.imgWidth});
        this.wasm_img.rotate(false);
      },
      'rotate_clockwise': () => {
        this.props.setWidthHeight({width: props.imgHeight, height: props.imgWidth});
        this.wasm_img.rotate(true);
      },
      'flip_h': () => {
        this.wasm_img.flip_h();
      },
      'flip_v': () => {
        this.wasm_img.flip_v();
      }
    }
  }

  // rotate 90 is an reversible operation, no need to call apply() in onClick handler,
  // I don't even bother adding an 'apply' button,
  // just apply the changes before unmount.
  componentWillUnmount = () => {
    this.wasm_img.apply_change();
  };

  onClick = evt => {
    this.op[evt.target.id]();
    this.props.redraw()
  };

  render() {
    return (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <button className='editor-btn' id='rotate_counter_clockwise' onClick={this.onClick}>
              {icons.rotate_counter_clockwise}
            </button>
            <button className='editor-btn' id="rotate_clockwise" onClick={this.onClick}>
              {icons.rotate_clockwise}
            </button>
            <button className='editor-btn' id="flip_h" onClick={this.onClick}>
              {icons.flip_horizontal}
            </button>
            <button className='editor-btn' id="flip_v" onClick={this.onClick}>
              {icons.flip_vertical}
            </button>
          </div>
        </div>
    )}
}

const mapStateToProps = state => ({
  imgWidth: state.imgStat.get('width'),
  imgHeight: state.imgStat.get('height'),
});
const mapDispatchToProps = dispatch => bindActionCreators({setWidthHeight}, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Rotate);
