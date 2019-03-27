extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use super::Image;

#[wasm_bindgen]
impl Image {
    // flip the image vertically
    pub fn flip_v(&mut self) {
        let (w, h) = (self.width as usize, self.height as usize);

        let mut rows: Vec<&mut [u8]> = self.pixels.chunks_mut(w * 4).collect();
        let mut tmp_row= vec![0_u8; w * 4];
        let mut tmp_row_ref = tmp_row.as_mut_slice();
        for row_idx in 0..(h/2) {
            rows[row_idx].swap_with_slice(tmp_row_ref);
            rows[h - row_idx - 1].swap_with_slice(tmp_row_ref);
            rows[row_idx].swap_with_slice(tmp_row_ref);
        }
    }

    // flip the image horizontally
    pub fn flip_h(&mut self) {
        let w = self.width as usize;
        let mut tmp_row = vec![0_u32; w];
        let mut tmp_row_ref = tmp_row.as_mut_slice();

        for row in self.pixels.chunks_mut(w * 4) {
            for pixel_idx in 0..w {
                tmp_row_ref[pixel_idx] =
                    ((row[pixel_idx * 4 + 0] as u32) << 24) |
                        ((row[pixel_idx * 4 + 1] as u32) << 16) |
                        ((row[pixel_idx * 4 + 2] as u32) << 8) |
                        ((row[pixel_idx * 4 + 3] as u32) << 0);
            }
            tmp_row_ref.reverse();

            for pixel_idx in 0..w {
                row[pixel_idx * 4 + 0] = ((tmp_row_ref[pixel_idx] >> 24) & 0xff) as u8;
                row[pixel_idx * 4 + 1] = ((tmp_row_ref[pixel_idx] >> 16) & 0xff) as u8;
                row[pixel_idx * 4 + 2] = ((tmp_row_ref[pixel_idx] >> 8) & 0xff) as u8;
                row[pixel_idx * 4 + 3] = ((tmp_row_ref[pixel_idx] >> 0) & 0xff) as u8;
            }
        }
    }
}
