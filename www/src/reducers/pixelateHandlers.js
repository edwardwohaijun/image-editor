import {SHOW_PIXELATE_HANDLERS, SET_PIXELATE_HANDLERS_POSITION} from '../constants/actions';
import {fromJS} from "immutable";
const initialState = fromJS({
  visible: false, position: {x: 0, y: 0, width: 0, height: 0}
});

export function pixelateHandlers(state = initialState, action = {type: ''}) {
  switch(action.type){
    case SHOW_PIXELATE_HANDLERS:
      return state.set("visible", action.visible);

    case SET_PIXELATE_HANDLERS_POSITION:
      return state.set("position", fromJS(action.rect));

    default:
      return state;
  }
}
