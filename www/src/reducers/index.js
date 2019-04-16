import {combineReducers} from 'redux';
import {imgStat} from './imgStat';
import {showCropHandlers} from './cropHandlersVisible';
import {pixelateHandlers} from './pixelateHandlers'
import {miniHandlers} from './miniHandlers'

const reducer = combineReducers({
  imgStat,
  cropHandlersVisible: showCropHandlers,
  pixelateHandlers,
  miniHandlers,
});

export default reducer;
