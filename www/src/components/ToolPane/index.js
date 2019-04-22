import React, {Component} from 'react';
import {connect} from "react-redux";
import toolIcons from './toolIcons'
import AccordionMenu from './AccordionMenu'

class ToolPane extends Component {
  constructor(props) {
    super(props);
    this.accordion = null;
    this.state = {
    };
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (!this.props.selectedTool) { // restoring the img should move Accordion back to original position.
      this.accordion.style.transform = 'translate(0px, 0px)'
    }
  };

  onSelectTool = evt => {
    let parent = evt.target.closest('.tool-icon');
    if (parent) {
      this.props.onSelectTool(parent.id);
      this.accordion.style.transform = 'translate(256px, 0px)'
    } else {
      this.props.onSelectTool(null);
      this.accordion.style.transform = 'translate(0px, 0px)'
    }
  };

  render() {
    // -56px: the width of vertical toolbar on the left
    return (
        <div style={{display: 'flex', height: 'calc(100vh - 56px)'}}>
          <div ref={div => this.accordion = div} id='tool-prop-list'
               style={{width: '256px', height: '100%', position: 'absolute', backgroundColor: '#2d2e37', left: '-200px', zIndex: 5}}>
            <AccordionMenu selectedTool={this.props.selectedTool} close={this.onSelectTool} zoomRatio={this.props.zoomRatio} loadImage={this.props.loadImage}/>
            {/* passing null(or passing nothing) close the AccordionMenu(or hide it by translating it to the left), passing toolID translate it into the view */}
          </div>
          <ul style={{width: "56px", height: "100%", listStyleType: 'none', padding: '0', backgroundColor: '#3f414c', marginTop: 0, zIndex: 10}}>
            <ToolIcon id='tool-basic' iconID='basic' onClick={this.onSelectTool} selected={this.props.selectedTool === 'tool-basic'}/>
            <ToolIcon id='tool-transform' iconID='transform' onClick={this.onSelectTool} selected={this.props.selectedTool === 'tool-transform'}/>
            <ToolIcon id='tool-color' iconID='color' onClick={this.onSelectTool} selected={this.props.selectedTool === 'tool-color'}/>
            <ToolIcon id='tool-filter' iconID='filter' onClick={this.onSelectTool} selected={this.props.selectedTool === 'tool-filter'} />
            <ToolIcon id='tool-text' iconID='text' onClick={this.onSelectTool} selected={this.props.selectedTool === 'tool-text'}/>
          </ul>
        </div>
    )}
}

const mapStateToProps = state => ({zoomRatio: state.imgStat.get('zoomRatio')});
export default connect(mapStateToProps, null)(ToolPane);

const iconStyle = {
  width: '56px', height: '44px', padding: 0, cursor: 'pointer'
};
const ToolIcon = props => (
    <li style={iconStyle} onClick={props.onClick} className='tool-icon' id={props.id}>
      <button className='tool-icon' style={{pointerEvents: 'none'}}>
        {toolIcons(props.iconID, props.selected)}
      </button>
    </li>
);
