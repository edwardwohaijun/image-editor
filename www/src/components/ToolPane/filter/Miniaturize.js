import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';
import {showMiniHandlers} from "../../../actions";
import {bindActionCreators} from "redux";
import {connect} from "react-redux";

class Miniaturize extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      handlerVisible: true,
      blurRadius: 15, // [10, 20, 2]
      sigma: 5,
      saturation: 0,
      brightness: 0,
    };
    this.heights = {top: 0, bottom: 0};
    this.changeApplied = false;
  }

  miniaturize = is_top => {
    // todo: validity check, make sure this.heights doesn't exceed boundaries.
    if (is_top) { // todo: make sigma an argument, let users slide to change its value.
      this.wasm_img.miniaturize(9, this.heights.top, is_top);
    } else {
      this.wasm_img.miniaturize(9, this.heights.bottom, is_top);
    }
    this.props.redraw();
  };

  componentDidMount = () => this.props.showHandler(true);

  componentWillUnmount = () => {
    this.props.showHandler(false);
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  componentDidUpdate = () => { // the only update is handler position, triggered from MinilHandlers by moving handlers.
    // but when miniHandlers get mounted, it'd call setMiniRegion() which is a redux action, \
    // then componentDidUpdate react to this store change by calling miniaturize().
    let top_height = this.props.heights.get('top');
    let bottom_height = this.props.heights.get('bottom');

    if (top_height < 0 || top_height > this.props.imgHeight || bottom_height < 0 || bottom_height > this.props.imgHeight) {
      return
    }

    if (this.heights.top !== top_height) {
      this.heights.top = top_height;
      this.miniaturize(true)
    }
    if (this.heights.bottom !== bottom_height) {
      this.heights.bottom = bottom_height;
      this.miniaturize(false)
    }
    this.changeApplied = false;
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };


  toggleHandlers = evt => {
    let handler = document.getElementById('canvas-handler');
    if (handler) {
      handler.style.visibility = evt.target.checked ? 'visible' : 'hidden';
      this.setState({handlerVisible: !this.state.handlerVisible})
    }
  };

  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          Miniaturize
          Please use an image with a top-down view
          {/* todo: add a contrast/brightness slider  */}
          <div className='toggle-btn-wrapper' style={{paddingLeft: '8px', paddingRight: '8px'}}>
            <div>Show handler</div>
            <div>
              <input type="checkbox" id="toggle-mini-handlers" className='toggle-input' style={{display:'none'}}
                     checked={this.state.handlerVisible} onChange={this.toggleHandlers} />
              <label htmlFor="toggle-mini-handlers" className="toggle-label"><span /></label>
            </div>
          </div>

          <ApplyButton onApply={this.onApply}/>
        </div>
    )}
}

const mapStateToProps = state => ({
  heights: state.miniHandlers.get('heights'),
  imgWidth: state.imgStat.get('width'),
  imgHeight: state.imgStat.get('height'),
});
const mapDispatchToProps = dispatch => bindActionCreators({showHandler: showMiniHandlers}, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Miniaturize);
