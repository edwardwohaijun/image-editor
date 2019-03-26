// Gaussian blur, motion blur, cartoonize, sharpen, smoothen, miniaturize, mosaic, pixelate

import imgObj from '../../common/imgObj'
import {memory} from "image-editor/image_editor_bg";
import React, {Component} from 'react';

class FilterTool extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = () => { };
  componentDidUpdate = () => { };

  render() {
    return (
        <div>filter tool</div>
    )}
}

export default FilterTool
