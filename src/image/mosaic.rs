extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use super::Image;

#[wasm_bindgen]
impl Image {
    // http://www.imageprocessingplace.com/downloads_V3/root_downloads/tutorials/An_Introduction_to_Image_Mosaicing.htm
    pub fn mosaic(&mut self) {
        let w = self.width;
        let h = self.height;
/*
        let mut rows: Vec<&mut [u8]> = self.pixels.chunks_mut((w * 4) as usize).collect();
        let mut tmp_row= vec![0_u8; (w * (4 as u32)) as usize];
        let mut tmp_row_ref = tmp_row.as_mut_slice();
        for row_idx in 0..(h/2) {
            rows[row_idx as usize].swap_with_slice(tmp_row_ref);
            rows[(h - row_idx - 1) as usize].swap_with_slice(tmp_row_ref);
            rows[row_idx as usize].swap_with_slice(tmp_row_ref);
        }
*/
    }
}
