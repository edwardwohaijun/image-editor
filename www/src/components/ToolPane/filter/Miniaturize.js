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
      saturation: 0,
      brightness: 0,
    };
    this.heights = {top: 0, bottom: 0};
    this.changeApplied = true;
  }

  miniaturize = () => {
    console.log('mniniaturize: ', this.heights)
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
    // then componentDidUpdate react to this store change by calling the following miniaturize().
    let top_height = this.props.heights.get('top');
    let bottom_height = this.props.heights.get('bottom');
    if (top_height === this.heights.top && bottom_height === this.heights.bottom) {
      return
    }
    this.heights.top = top_height;
    this.heights.bottom = bottom_height;
    this.changeApplied = false;
    this.miniaturize();
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };

  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          Miniaturize
          Please use an image with a top-down view
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
