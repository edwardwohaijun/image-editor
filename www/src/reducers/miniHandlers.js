import {SHOW_MINI_HANDLERS, SET_MINI_HANDLERS_HEIGHTS} from '../constants/actions';
import {fromJS} from "immutable";
const initialState = fromJS({
  visible: false, heights: {top: 0, bottom: 0},
});

export function miniHandlers(state = initialState, action = {type: ''}) {
  switch(action.type){
    case SHOW_MINI_HANDLERS:
      return state.set("visible", action.visible);

    case SET_MINI_HANDLERS_HEIGHTS:
      return state.set("heights", fromJS(action.heights));

    default:
      return state;
  }
}
