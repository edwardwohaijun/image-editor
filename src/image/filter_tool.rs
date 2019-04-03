extern crate wasm_bindgen;
extern crate web_sys;

use wasm_bindgen::prelude::*;
use super::Image;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
impl Image {
    pub fn rgb_to_hsi(&mut self) {
        let width = self.width as usize;
        let height = self.height as usize;
        let size = width * height;
        self.hsi = vec![vec![0_f64; size], vec![0_f64; size], vec![0_f64; size]];

        let two_pi = 2.0 * std::f64::consts::PI;
        let (mut R, mut G, mut B, mut hue);

        for idx in 0..size {
            // normalize rgb value to [0, 1]
            // many online materials say: to normalise R/G/B into [0, 1], divide each value by (R+G+B)
            // but this is wrong, 255 should be the divisor
            R = self.pixels_bk[idx * 4 + 0] as f64 / 255.0;
            G = self.pixels_bk[idx * 4 + 1] as f64 / 255.0;
            B = self.pixels_bk[idx * 4 + 2] as f64 / 255.0;

            hue = (0.5 * ((R-G) + (R-B)) / (((R-G) * (R-G) + (R-B) * (G-B)).sqrt() + 0.001)).acos(); // adding 0.001 to avoid dividing by zero
            if B > G {
                hue = two_pi - hue
            }

            self.hsi[0][idx] = hue;
            self.hsi[1][idx] = 1.0 - 3.0 / (R + G + B) * R.min(G).min(B); // saturation
            self.hsi[2][idx] = (R + G + B) / 3.0 // intensity
        }
    }

}
