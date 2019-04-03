import imgObj from '../../common/imgObj'
import {memory} from "image-editor/image_editor_bg";
import React, {Component} from 'react';

// show img stat: dimensions, file size, file type, JPG quality
class BasicTool extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = () => { };
  componentDidUpdate = () => { };

  render() {
    return (
        <div>basic tool</div>
    )}
}

export default BasicTool
