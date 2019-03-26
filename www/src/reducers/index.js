import {combineReducers} from 'redux';
import {imgStat} from './imgStat';
import {showCropHandlers} from './cropHandlersVisible';
// import {showScaleHandlers} from './scaleHandlersVisible';

const reducer = combineReducers({
  imgStat,
  cropHandlersVisible: showCropHandlers,
  // scaleHandlersVisible: showScaleHandlers
});

export default reducer;
