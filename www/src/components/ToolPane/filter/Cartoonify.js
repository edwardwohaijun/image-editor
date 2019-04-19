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
    // for img with dimension: 800x600, Gaussian sigma is better to be >= 5 for best effect, range sigma has little effect
    // first arg is domain sigma, 2 or 3 for small image(below 400x400), 4 for 700x700, 5 for 800x800, and so on.
    // this is for controlling blurring radius

    // second arg is range sigma, which has nothing to do with image dimension, so just leave it unchanged for all dimensions.
    // range sigma is for checking similarity between 2 color pixels. I use L*a*b to get the diff, which is a little bit expensive, \
    // for naive and lightweight impl, use ((r1+g1+b1) - (r2+g2+b2)).abs(), but the argument value should fall between [40, 60] for all dimensions.
    this.wasm_img.cartoonify(4, 5, 3, false); // Gaussian sigma(std dev)
    // range sigma should not be larger than 10 for all dimension, because it's the color difference, which has nothing to do with space domain

    // if color diff is calculated using Lab, then sigma range must be <= 10, \
    // if .............................. naive (r1+b1+c1) - (r2+b2+c2), sigma range must be around 50, neither has anything to do with img dimension.

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

          <p style={{fontSize: '12px', marginTop: '18px', color: '#ddd'}}>
            note: the bigger your image, the bigger the stdDev should be.
          </p>
        </div>
    )}
}
