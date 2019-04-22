import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import Basic from './Basic';
import Exposure from './Exposure';

class ColorTool extends Component {
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

  componentDidMount = () => this.wasm_img.rgb_to_hsi();
  componentWillUnmount = () => this.wasm_img.clear_hsi();

  render() {
    return (
        <div>
          <ToolHeader onSelect={this.onSelectTool} toolID='color-basic' selectedTool={this.state.selectedTool} label='BASIC'>
            <Basic onSelectTool={this.onSelectTool} redraw={this.props.redraw} />
          </ToolHeader>
          <ToolHeader onSelect={this.onSelectTool} toolID='color-exposure' selectedTool={this.state.selectedTool} label='EXPOSURE'>
            <Exposure onSelectTool={this.onSelectTool} redraw={this.props.redraw}/>
          </ToolHeader>
        </div>
  )}
}

export default ColorTool

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
