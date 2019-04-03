extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use super::Image;

#[wasm_bindgen]
impl Image {
    pub fn rgb_to_grayscale(&mut self) {
        let (w, h) = (self.width as usize, self.height as usize);
        let mut current_idx: usize;

        let mut rgb: (u8, u8, u8);
        let mut grayscale;
        for row in 0..h {
            for col in 0..w {
                current_idx = row * w + col;
                rgb = (self.pixels[current_idx * 4 + 0], self.pixels[current_idx * 4 + 1], self.pixels[current_idx * 4 + 2]);
                grayscale = (rgb.0 as f64 * 0.2989 + rgb.1 as f64 * 0.5870 + rgb.2 as f64 * 0.1140) as u8;

                self.pixels[current_idx * 4 + 0] = grayscale;
                self.pixels[current_idx * 4 + 1] = grayscale;
                self.pixels[current_idx * 4 + 2] = grayscale;
            }
        }
    }
}
