// Gaussian blur, motion blur, cartoonize, sharpen, smoothen, miniaturize, mosaic, pixelate

import imgObj from '../../common/imgObj'
import {memory} from "image-editor/image_editor_bg";
import React, {Component} from 'react';


// cartoonify:
// https://stacks.stanford.edu/file/druid:yt916dh6570/Dade_Toonify.pdf
// https://mathematica.stackexchange.com/questions/60433/how-to-generate-a-cartoon-of-a-face
// http://59.80.44.44/inside.mines.edu/~whoff/courses/EENG510/projects/2013/Anil_slides.pdf
// https://stackoverflow.com/questions/1357403/how-to-cartoon-ify-an-image-programmatically


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
