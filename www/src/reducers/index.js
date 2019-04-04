import {combineReducers} from 'redux';
import {imgStat} from './imgStat';
import {showCropHandlers} from './cropHandlersVisible';
import {pixelateHandlers} from './pixelateHandlers'

const reducer = combineReducers({
  imgStat,
  cropHandlersVisible: showCropHandlers,
  pixelateHandlers,
});

export default reducer;
