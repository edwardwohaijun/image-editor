import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';

export default class Cartoonify extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
    };
    this.changeApplied = false;
  }

  componentWillUnmount = () => {
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  onCartoonify = () => {
    this.wasm_img.cartoonify(2);
    this.props.redraw()
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.props.onSelectTool(''); // to unmount myself.
  };

  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>
          <button onClick={this.onCartoonify}>Cartoonify</button>
          <ApplyButton onApply={this.onApply}/>
        </div>
    )}
}
