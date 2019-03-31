// import * as wasm from "image-editor";
// import {Image} from "image-editor/image_editor";
// import { memory } from "image-editor/image_editor_bg";

// import {Image} from "wasm-greet/wasm_greet";
// import { memory } from "wasm-greet/wasm_greet_bg";
import {Provider} from 'react-redux';
import thunk from 'redux-thunk';
import {createStore, applyMiddleware, compose} from 'redux';
import {fromJS} from 'immutable';

import 'babel-polyfill';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import Main from './components/Main';
import reducers from './reducers';
import './style.css';

let initialState = {
    imgStat: fromJS({ // main() state 中也有个 imgStat(存放img的size, w/h等), 重名不好. 本例直接: viewRate: 0 即可.
      zoomRatio: 0, // range: [0.2, 4]. 0 is not a valid ratio, but canvas redraw only when this value change from 0 to a valid value
      width: 0, // width/height can be read from wasm_img, but not accurate in real time.
      height: 0, // typical use case: user scale down the img, then click 'Crop' tool without applying the changes,\
      // I need to restore the img to original width/height by calling wasm_img.discard_change(), then redraw, both of which are expensive, \
      // By the time Crop component is loaded, Scale-to-original might not have finished yet.
      // But Crop component need img width/height immediately to set handler position, it might read the scaled-down width/height value
      // So I just save the current width/height in redux for quick access.

      // size: 0,
    }),

    cropHandlersVisible: false, // the 8 points around canvas, with which you can scale up/down, set region to crop. For other operations, hide it
    // scaleHandlersVisible: false, depreciated
    /*
    handlerVisible: fromJS({
      crop: false,
      scale: false,
    })
    */
};

let store = createStore(reducers, initialState, compose(
  applyMiddleware(thunk),
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  render() { return <Main />}
}

ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>, document.getElementById('main')
);
