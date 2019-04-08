import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';

export default class Blur extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
    };

    this.sliderRange = {
      contrast: [1, 20, 1], // [min, max, step]
      brightness: [10, 10, 1],
    };
    this.changeApplied = true;
  }

  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  onBlur = () => {
    this.wasm_img.blur(3); // range: [1, 11, 2]
    this.props.redraw();
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };

  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <button onClick={this.onBlur}>test</button>
          <ApplyButton onApply={this.onApply}/>
        </div>
    )}
}
