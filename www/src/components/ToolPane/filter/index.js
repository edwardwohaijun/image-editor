import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
// import Cartoonify from './Cartoonify';
import GaussianBlur from './GaussianBlur';
import BilateralFilter from './BilateralFilter';
import Miniaturize from './Miniaturize';
//import MotionBlur from './MotionBlur';
import Pixelate from './Pixelate';
//import Sharpen from './Sharpen';

class FilterTool extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTool: ''
    };
    this.wasm_img = imgObj.get_wasm_img();
  }

  onSelectTool = evt => {
    let toolID = !evt ? '' : evt.target.id;
    if (toolID === this.state.selectedTool) {
      return
    }
    this.setState({selectedTool: toolID});
  };

  // todo: it's better to have hsi ready when the app is loaded
  // too many functions require hsi, it's not efficient to generate/clear when switching from functionA to functionB
  componentDidMount = () => this.wasm_img.rgb_to_hsi();
  componentWillUnmount = () => this.wasm_img.clear_hsi();
  componentDidUpdate = () => { };

  render() {
    return (
        <div>
          <ToolHeader onSelect={this.onSelectTool} toolID='filter-pixelate' selectedTool={this.state.selectedTool} label='PIXELATE'>
            <Pixelate onSelectTool={this.onSelectTool} redraw={this.props.redraw}/>
          </ToolHeader>

          <ToolHeader onSelect={this.onSelectTool} toolID='filter-gaussianblur' selectedTool={this.state.selectedTool} label='BLUR'>
            <GaussianBlur onSelectTool={this.onSelectTool} redraw={this.props.redraw}/>
          </ToolHeader>

          <ToolHeader onSelect={this.onSelectTool} toolID='filter-miniaturize' selectedTool={this.state.selectedTool} label='MINIATURIZE'>
            <Miniaturize onSelectTool={this.onSelectTool} redraw={this.props.redraw} loadImage={this.props.loadImage}/>
          </ToolHeader>

          <ToolHeader onSelect={this.onSelectTool} toolID='filter-bilateral-filter' selectedTool={this.state.selectedTool} label='SMOOTHEN'>
            <BilateralFilter onSelectTool={this.onSelectTool} redraw={this.props.redraw} loadImage={this.props.loadImage}/>
          </ToolHeader>

          {/*<ToolHeader onSelect={this.onSelectTool} toolID='filter-cartoonify' selectedTool={this.state.selectedTool} label='CARTOONIFY'>
            <Cartoonify onSelectTool={this.onSelectTool} redraw={this.props.redraw} />
          </ToolHeader>*/}

          {/*<ToolHeader onSelect={this.onSelectTool} toolID='filter-motionblur' selectedTool={this.state.selectedTool} label='MOTION BLUR'>
            <MotionBlur onSelectTool={this.onSelectTool} redraw={this.props.redraw}/>
          </ToolHeader>*/}

          {/*<ToolHeader onSelect={this.onSelectTool} toolID='filter-sharpen' selectedTool={this.state.selectedTool} label='SHARPEN'>
            <Sharpen onSelectTool={this.onSelectTool} redraw={this.props.redraw}/>
          </ToolHeader>*/}
        </div>
  )}
}

export default FilterTool

const ToolHeader = props => {
  let selected = props.selectedTool === props.toolID;
  let svgStyle = selected ? {transform: 'rotate(180deg)'} : {transform: 'rotate(0deg)'};
  let selectedStyle = selected ? {color: 'darkorange'} : null;
  return (
      <div className='editor-header-wrapper'>
        <div id={props.toolID} className='editor-header' onClick={props.onSelect}>
          <span style={selectedStyle}>{props.label}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="8" className='svg-down-arrow' style={svgStyle}>
            <path fill="#CCC" d="M7.19 7.54L0 .34.34 0l6.85 6.85L14.04 0l.34.34-7.19 7.2z"/>
          </svg>
        </div>
        {selected ? props.children : null}
      </div>
  )
};
