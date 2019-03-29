import imgObj from '../../common/imgObj'
import React, {Component} from 'react';

export default class Exposure extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {

    }
  }


  render() {
    return (
        <div>
          auto adjust
          manual adjust (contrast +/-, brightness +/-)
          later: highlight, shadow
        </div>
    )}
}
