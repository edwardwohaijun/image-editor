import {SET_ZOOM_RATIO, SHOW_CROP_HANDLERS} from '../constants/actions';

export function setZoomRatio(zoomRatio){
  return {
    type: SET_ZOOM_RATIO,
    zoomRatio
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
