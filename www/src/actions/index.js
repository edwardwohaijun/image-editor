import {SET_ZOOM_RATIO, SET_WIDTH_HEIGHT, SHOW_CROP_HANDLERS, SHOW_PIXELATE_HANDLERS, SET_PIXELATE_HANDLERS_POSITION,
  SHOW_MINI_HANDLERS, SET_MINI_HANDLERS_HEIGHTS} from '../constants/actions';

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

export function showPixelateHandlers(visible) {
  return {
    type: SHOW_PIXELATE_HANDLERS,
    visible
  }
}

export function setPixelateHandlersPosition(rect) {
  return {
    type: SET_PIXELATE_HANDLERS_POSITION,
    rect
  }
}

export function showMiniHandlers(visible) {
  return {
    type: SHOW_MINI_HANDLERS,
    visible
  }
}

export function setMiniHeights(heights) {
  return {
    type: SET_MINI_HANDLERS_HEIGHTS,
    heights
  }
}
