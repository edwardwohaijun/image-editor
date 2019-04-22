import {Image} from "image-editor/image_editor";

let imgObj = (function() { // todo: bad naming
  let img;
  function createImgObj(){
    img = Image.new(0, 0, new Uint8Array(2)); // img obj initialization need a buffer array argument, so I just pass a dummy
    return img;
  };

  return {
    get_wasm_img: function(){
      if (!img) {img = createImgObj();}
      return img;
    },
    imgBuff: null, // when scaling up/down an image, the img buffer(returned from getImageData()) is the same, I save it here for frequent access
  };
})();

export default imgObj;
