import {fromJS} from 'immutable';
import {SET_ZOOM_RATIO} from '../constants/actions';

const initialState = fromJS({});

export function imgStat(state = initialState, action = {type: ''}) {
  switch(action.type){
    case SET_ZOOM_RATIO:
      return state.set('zoomRatio', fromJS(action.zoomRatio));

    default:
      return state;
  }
}
