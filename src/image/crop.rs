extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use super::Image;

#[wasm_bindgen]
impl Image {
    // tuple (u32, u32) is not implemented by "wasm_bindgen::convert::FromWasmAbi", so I have to use 4 arguments.
    pub fn crop(&mut self, top_x: u32, top_y: u32, width: u32, height: u32) {
        // caller need to make sure the assert hold
        // assert!(top_x < bottom_x && top_y < bottom_y);
        // let (w, h) = (bottom_x - top_x, bottom_y - top_y);

        let mut new_pixels = vec![0_u8; (width * height * 4) as usize];
        let mut old_x;
        let mut old_y;
        let mut old_idx: usize;
        let mut current_idx: usize;
        for row in 0..height {
            for col in 0..width {
                old_x = top_x + col; // x/y position in original pixels vector
                old_y = top_y + row;
                old_idx = (old_y * self.width + old_x) as usize;
                current_idx = (row * width + col) as usize;
                new_pixels[current_idx * 4 + 0] = self.pixels[old_idx * 4 + 0];
                new_pixels[current_idx * 4 + 1] = self.pixels[old_idx * 4 + 1];
                new_pixels[current_idx * 4 + 2] = self.pixels[old_idx * 4 + 2];
                new_pixels[current_idx * 4 + 3] = self.pixels[old_idx * 4 + 3];
            }
        }

        self.pixels = new_pixels;
        self.width = width;
        self.height = height;
    }
}
