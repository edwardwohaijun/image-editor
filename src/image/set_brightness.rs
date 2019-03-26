extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use super::Image;

#[wasm_bindgen]
impl Image {
    pub fn set_brightness(&mut self) {
        let (w, h) = (self.width as usize, self.height as usize);

        // 3 items denote 3 RGB color channels
        let mut intensity_dist = vec![[0_f64; 256], [0_f64; 256], [0_f64; 256], [0_f64; 256]];
        let mut pixel_idx = 0;
        // get distribution of each pixel(number of occurrence), saved in intensity_dist.
        for row in 0..h {
            for col in 0..w {
                pixel_idx = row * w + col;
                for (idx, color_value) in self.pixels[pixel_idx * 4 .. pixel_idx * 4 + 4].iter().enumerate() {
                    intensity_dist[idx][*color_value as usize] += 1.0;
                }
            }
        }

        // normalise number of occurrence to [0, 1].
        let total_pixel_num = (w * h) as f64;
        for color_channel in intensity_dist.iter_mut() {
            for intensity in color_channel.iter_mut() {
                *intensity /= total_pixel_num
            }
        }

        let mut intensity_dist2 = vec![0_f64; 256];
        for intensity in 0..256 as usize {
            intensity_dist2[intensity] = (intensity_dist[0][intensity] + intensity_dist[1][intensity] + intensity_dist[2][intensity]) / 3.0;
        }

        let mut current_item;
        let mut last_item = intensity_dist2[255];
        intensity_dist2[255] = 1.0;
        for idx in (1..255).rev() {
            current_item = intensity_dist2[idx];
            if intensity_dist2[idx + 1] - last_item < 0.0 {
                intensity_dist2[idx] = 0.0
            } else {
                intensity_dist2[idx] = intensity_dist2[idx + 1] - last_item
            }
            last_item = current_item
        }

        let mut pixel_value;
        let mut new_pixel_value;
        for row in 0..h {
            for col in 0..w {
                pixel_idx = row * w + col;

                pixel_value = self.pixels[pixel_idx * 4 + 0];
                new_pixel_value = intensity_dist2[pixel_value as usize] * 255 as f64;
                if new_pixel_value > 255.0 {
                    self.pixels[pixel_idx * 4 + 0] = 255
                } else {
                    self.pixels[pixel_idx * 4 + 0] = new_pixel_value.round() as u8
                }

                pixel_value = self.pixels[pixel_idx * 4 + 1];
                new_pixel_value = intensity_dist2[pixel_value as usize] * 255 as f64;
                if new_pixel_value > 255.0 {
                    self.pixels[pixel_idx * 4 + 1] = 255
                } else {
                    self.pixels[pixel_idx * 4 + 1] = new_pixel_value.round() as u8
                }

                pixel_value = self.pixels[pixel_idx * 4 + 2];
                new_pixel_value = intensity_dist2[pixel_value as usize] * 255 as f64;
                if new_pixel_value > 255.0 {
                    self.pixels[pixel_idx * 4 + 2] = 255
                } else {
                    self.pixels[pixel_idx * 4 + 2] = new_pixel_value.round() as u8
                }
            }
        }
    }
}
