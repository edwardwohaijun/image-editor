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
    this.changeApplied = true;
    this.switched = false;
    this.op = {
      'rotate_counter_clockwise': () => {
        this.switched = !this.switched;
        this.wasm_img.rotate(false);
      },
      'rotate_clockwise': () => {
        this.switched = !this.switched;
        this.wasm_img.rotate(true);
      },
      'flip_h': () => { // this can be done within JS by: ctx.scale(-1, 1); 哈哈
        this.wasm_img.flip_h();
      },
      'flip_v': () => {
        this.wasm_img.flip_v();
      }
    };
  }

  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  onClick = evt => {
    this.op[evt.target.id]();
    this.changeApplied = false;
    this.props.redraw()
  };

  onApply = () => {
    if (this.switched) {
      this.props.setWidthHeight({width: this.props.imgHeight, height: this.props.imgWidth});
    }
    this.wasm_img.apply_change();
    this.changeApplied = true;
    this.props.onSelectTool('');
  };

  render() {
    return (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
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

          <div style={{display: 'flex', justifyContent: 'space-around'}}>
            <button className='primary-btn apply-btn' onClick={this.onApply}>
              <svg viewBox="0 0 20 20" width="20" height="20" transform='scale(0.8, 0.8)'>
                <path fillRule="evenodd" fill='#FFF' d="M18.388 2L20 3.557 6.576 17.458 0 11.108 1.804 9.24l4.964 4.793L18.388 2z" />
              </svg>
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
