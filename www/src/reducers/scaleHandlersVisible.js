import {SHOW_SCALE_HANDLERS} from '../constants/actions';
const initialState = false;

export function showScaleHandlers(state = initialState, action = {type: ''}) {
  switch(action.type){
    case SHOW_SCALE_HANDLERS:
      return action.show;

    default:
      return state;
  }
}
