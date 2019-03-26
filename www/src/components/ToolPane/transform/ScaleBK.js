// flip-h/v, rotate 90/180(other degrees to be add later), shrea
// scale up/down
import imgObj from '../../common/imgObj'
import React, {Component} from 'react';

export default class Scale extends Component {
  constructor(props) {
    super(props);
    this.imgObj = imgObj.getImgObj();
    this.imgWidth = this.imgObj.width(); // these 2 values are accessed frequently, but got changed only after clicking apply btn,
    this.imgHeight = this.imgObj.height(); // and changed values can be calculated in JS land, no need to access wasm.
    this.scaleRegion = null;
    this.changeApplied = false;

    this.state = {
      scaleFactor: 100
    }
  }

  componentDidMount = () => { };
  componentDidUpdate = prevProps => { };

  // todo: check whether changes have been applied, if not, call imgObj.discard(), and redraw();
  // unmount 是切换到其他component, 肯定要discard, redraw, 但如果还待在transform panel中, 但切换到其他, 如: crop/rotate, 则当前component没有unmount,
  // dan discard还是要执行, 繁啊.....
  // 切换到其他transform也要discard(如果没有apply), 因为切换到rotate后, rotate 90, 此时w/h都变了. ratio值变得没意义了.
  // 总之, unmount时候需要check this.changeApplied, DidUpdate中也要check, 是否selectedTool不是自己了, 不是的话, 也要discard.
  componentWillUnmount = () => {
    console.log('unmouting')
  };

  // todo: 能做成: unmount自动redraw就好了.
  discardChange = () => { // calling redraw, 但页面上的 w/h/ratio都要恢复original, 但如果此刻都要 unmount了, 恢复也必要吗?


  };

  onScaleChange = evt => {
    let eleID = evt.target.id;
    let scaleFactor = 1;
    switch (eleID) {
      case 'transform-scale-setter': {
        scaleFactor = evt.target.value;
        break;
      }
      case 'transform-scale-down-btn': {
        scaleFactor = Math.max(this.state.scaleFactor - 10, 10);
        break;
      }
      case 'transform-scale-up-btn': {
        scaleFactor = Math.min(this.state.scaleFactor + 10, 100);
        break;
      }
      default: return
    }

    if (this.state.scaleFactor === scaleFactor) {
      return
    }
    this.setState({scaleFactor})
  };

  onApply = evt => { // todo: parse 4 values to integer before passing to scale();
    let regionInfoEle = this.scaleRegion.getElementsByClassName('canvas-handler-region-info');
    let w = parseInt(regionInfoEle[0].innerText); // only block element support innerText, like div
    let h = parseInt(regionInfoEle[1].innerText);
    let ratio = parseInt(regionInfoEle[2].innerText);
    console.log('xy/ratio from DOM: ', w, '/', h, '/', ratio);
    // todo: check validity before passing to wasm
    // this.imgObj.scale(0.5);
    this.props.onSelectTool(''); // to hide the Scale setting pane
    this.props.redraw();
  };

  render() {
    let svgStyle = this.props.selectedTool === 'transform-scale' ? {transform: 'rotate(180deg)'} : {transform: 'rotate(0deg)'};
    let scale = this.state.scaleFactor;
    return (
        <div className='editor-header-wrapper'>
          <div id='transform-scale' className='editor-header' onClick={this.props.onSelectTool}>
            <span>SCALE</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="8" className='svg-down-arrow' style={svgStyle}>
              <path fill="#CCC" d="M7.19 7.54L0 .34.34 0l6.85 6.85L14.04 0l.34.34-7.19 7.2z"/>
            </svg>
          </div>
          {
            this.props.selectedTool !== 'transform-scale' ? null :
                <div>
                  {/*
                  todo: add: checkbox 'Lock Aspect Ratio'
                  make ratio an input box, changed values get reflected on scale handler
                  */}
                  <div id='scale-region-info' className='handler-info' ref={div => this.scaleRegion = div}
                       style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', paddingLeft: '8px', paddingRight: '8px', marginBottom: '0'}}>
                    <div style={{marginBottom: '18px'}}>
                      <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Width</label>
                      <div className='canvas-handler-region-info'>{Math.round(scale * this.imgWidth / 100) + ' px'}</div>
                    </div>
                    <div style={{marginBottom: '18px'}}>
                      <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Height</label>
                      <div className='canvas-handler-region-info'>{Math.round(scale * this.imgHeight / 100) + ' px'}</div>
                    </div>
                    <div style={{marginBottom: '18px'}}>
                      <label style={{color: '#a0a0a0', paddingLeft: '4px'}}>Ratio</label>
                      <div className='canvas-handler-region-info'>{scale + ' %'}</div>
                    </div>
                  </div>

                  <div style={{display: 'flex', alignItems: 'center', marginBottom: '24px'}}>
                    <button className='resize-view-btn' id='transform-scale-down-btn' onClick={this.onScaleChange}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                        <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                        <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
                      </svg>
                    </button>

                    <input type='range' id='transform-scale-setter' min='10' max='100' step='10' value={this.state.scaleFactor} onChange={this.onScaleChange} />

                    <button className='resize-view-btn' id='transform-scale-up-btn' onClick={this.onScaleChange}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                        <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                        <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
                      </svg>
                    </button>
                  </div>

                  <div style={{display: 'flex', justifyContent: 'space-around'}}>
                    <button className='primary-btn apply-btn' onClick={this.onApply}>
                      <svg viewBox="0 0 20 20" width="20" height="20" transform='scale(0.8, 0.8)'>
                        <path fillRule="evenodd" fill='#FFF' d="M18.388 2L20 3.557 6.576 17.458 0 11.108 1.804 9.24l4.964 4.793L18.388 2z" />
                      </svg>
                    </button>
                  </div>

                </div>
          }
        </div>
    )}
}
