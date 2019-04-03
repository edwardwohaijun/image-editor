import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';

export default class Pixelate extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      blockSize: 9,
    };
    this.changeApplied = true;
  }

  updateBlockSize = blockSize => this.setState({blockSize});

  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  // don't forget the edge case testing
  test_pixelate = () => {
    this.wasm_img.pixelate(450, 250, 170, 240, this.state.blockSize);
    this.props.redraw();
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };

// define/draw a pixelatedRect, once component get mounted, draw the pixelated region
// then let user to move/set the region, after mouse onKeyUp, redraw.
// clicking apply applies the effect and unmount the component
// the default rect should have a minimum w/h, in case the input img is smaller than this, use img size as rect's w/h
  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <button onClick={this.test_pixelate}>Pixelate</button>
          <ApplyButton onApply={this.onApply}/>
        </div>
    )}
}
