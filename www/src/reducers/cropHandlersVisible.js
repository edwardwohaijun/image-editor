import {SHOW_CROP_HANDLERS} from '../constants/actions';
const initialState = false;

export function showCropHandlers(state = initialState, action = {type: ''}) {
  switch(action.type){
    case SHOW_CROP_HANDLERS:
      return action.show;

    default:
      return state;
  }
}
