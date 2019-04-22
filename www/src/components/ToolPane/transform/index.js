// flip-h/v, rotate 90/180(other degrees to be add later), shrea
// scale up/down
import {connect} from "react-redux";
import {bindActionCreators} from "redux";
import {showCropHandlers} from '../../../actions'
import React, {Component} from 'react';
import Crop from './Crop';
import Scale from './Scale';
import Rotate from './Rotate';

class TransformTool extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTool: '' // all those tools are like accordion menu, one selected(collapsed), all others are hidden
    }
  }

  onSelectTool = evt => {
    // after applying crop, I need to unmount the Crop component(by passing an empty string to this fn),
    // and CropHandlers will get unmounted too(triggered in Crop's componentWillUnmount)
    // it's too complicated to reset cropHandler positions after crop, so I just unmount it.
    let toolID = !evt ? '' : evt.target.id;
    if (toolID === this.state.selectedTool) {
      return
    }
    this.setState({selectedTool: toolID});
  };

  render() {
    return (
        <div>
          <ToolHeader onSelect={this.onSelectTool} toolID='transform-crop' selectedTool={this.state.selectedTool} label='CROP'>
            <Crop onSelectTool={this.onSelectTool} redraw={this.props.redraw} showCropHandlers={this.props.showCropHandlers}/>
          </ToolHeader>
          <ToolHeader onSelect={this.onSelectTool} toolID='transform-rotate' selectedTool={this.state.selectedTool} label='ROTATE'>
            <Rotate onSelectTool={this.onSelectTool} redraw={this.props.redraw}/>
          </ToolHeader>
          <ToolHeader onSelect={this.onSelectTool} toolID='transform-scale' selectedTool={this.state.selectedTool} label='SCALE'>
            <Scale onSelectTool={this.onSelectTool} redraw={this.props.redraw}/>
          </ToolHeader>
        </div>
    )}
}

const mapDispatchToProps = dispatch => bindActionCreators({showCropHandlers}, dispatch);
export default connect(null, mapDispatchToProps)(TransformTool);

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
