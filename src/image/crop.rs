extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use super::Image;


macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
impl Image {
    pub fn crop(&mut self, top_x: i32, top_y: i32, width: u32, height: u32) {
        let mut top_x = top_x.max(0).min(self.width_bk as i32);
        let mut top_y = top_y.max(0).min(self.height_bk as i32);
        let mut width = width.min(self.width_bk);
        let mut height = height.min(self.height_bk);

        if top_x as u32 + width > self.width_bk {
            top_x = (self.width_bk - width) as i32
        }
        if top_y as u32 + height > self.height_bk {
            top_y = (self.height_bk - height) as i32
        }

        log!("img w/h: {:?}/{:?}, crop x/y/w/h: {:?}/{:?}/{:?}/{:?}: ", self.width, self.height, top_x, top_y, width, height);

        let mut new_pixels = vec![0_u8; (width * height * 4) as usize];
        let mut old_x;
        let mut old_y;
        let mut old_idx: usize;
        let mut current_idx: usize;
        for row in 0..height {
            for col in 0..width {
                old_x = top_x as u32 + col; // x/y position in original pixels vector
                old_y = top_y as u32 + row;
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
