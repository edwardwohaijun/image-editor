import {SET_ZOOM_RATIO, SET_WIDTH_HEIGHT, SHOW_CROP_HANDLERS} from '../constants/actions';

export function setZoomRatio(zoomRatio){
  return {
    type: SET_ZOOM_RATIO,
    zoomRatio
  }
}

export function setWidthHeight(wh) {
  return {
    type: SET_WIDTH_HEIGHT,
    width: wh.width,
    height: wh.height,
  }
}

export function showCropHandlers(show) {
  return {
    type: SHOW_CROP_HANDLERS,
    show
  }
}



/*
export function showScaleHandlers(show) {
  return {
    type: SHOW_SCALE_HANDLERS,
    show
  }
}
*/
