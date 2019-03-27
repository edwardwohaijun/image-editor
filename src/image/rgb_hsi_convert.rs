extern crate wasm_bindgen;
//use std::cmp;
use wasm_bindgen::prelude::*;
use super::Image;

#[wasm_bindgen]
impl Image {
    pub fn rgb_to_hsi(&self) -> Vec<f64> {
        let width = self.width_bk as usize;
        let height = self.height_bk as usize;
        let mut hsi =  Vec::with_capacity(w * h * 4); // vec![0_f64; w * h * 4]; // todo: I don't need the 4th alpha channel, how about w * h * 3

        let two_pi = 2.0 * std::f64::consts::PI;
        let mut rgb_sum: f64;
        let (mut idx, mut r, mut g, mut b, mut h, mut s, mut i, mut hue_tmp);
        for idx in 0..w * h {
            r = self.pixels_bk[idx * 4 + 0] as f64;  // use pixels_bk, the non-bk is used for real-time display
            g = self.pixels_bk[idx * 4 + 1] as f64;
            b = self.pixels_bk[idx * 4 + 2] as f64;
            rgb_sum = r + g + b;
            // normalize rgb value to [0, 1]
            r /= rgb_sum;
            g /= rgb_sum;
            b /= rgb_sum;

            if r != g || r != b { // add this check to avoid division by zero in the following {else block}
                hsi[idx * 4 + 2] = (r+g+b)/3.0;
                hsi[idx * 4 + 1] = 1.0 - 3.0 * r.min(g).min(b);
                hue_tmp = (0.5 * ((r-g) + (r-b)) / ((r-g) * (r-g) + (r-b) * (g-b)).sqrt()).acos();
                if b > g {
                    hsi[idx * 4 + 0] = two_pi - hue_tmp
                } else {
                    hsi[idx * 4 + 0] = hue_tmp
                }
            } else { // r == g == b
                hsi[idx * 4 + 0] = 0.0; // hue
                hsi[idx * 4 + 1] = 0.0; // saturation
                hsi[idx * 4 + 2] = r; // intensity
            }

            hsi[idx * 4 + 0] = self.pixels_bk[idx * 4 + 0] as f64 / rgb_sum as f64;
            hsi[idx * 4 + 1] = self.pixels_bk[idx * 4 + 1] as f64 / rgb_sum as f64;
            hsi[idx * 4 + 2] = self.pixels_bk[idx * 4 + 2] as f64 / rgb_sum as f64;



        }

        for idx in 0..w * h {
                // idx = (row * w + col) as usize;
                r = hsi[idx * 4 + 0];
                g = hsi[idx * 4 + 1];
                b = hsi[idx * 4 + 2];
                if r == g && r == b { // add this check to avoid division by zero in the following {else block}
                    hsi[idx * 4 + 0] = 0.0; // hue
                    hsi[idx * 4 + 1] = 0.0; // saturation
                    hsi[idx * 4 + 2] = r; // intensity
                } else {
                    hsi[idx * 4 + 2] = (r+g+b)/3.0;
                    hsi[idx * 4 + 1] = 1.0 - 3.0 * r.min(g).min(b);
                    hue_tmp = (0.5 * ((r-g) + (r-b)) / ((r-g) * (r-g) + (r-b) * (g-b)).sqrt()).acos();
                    if b > g {
                        hsi[idx * 4 + 0] = two_pi - hue_tmp
                    } else {
                        hsi[idx * 4 + 0] = hue_tmp
                    }
            }
        }
        hsi
    }

    pub fn hsi_to_rgb(&self, hsi: &[f64]) -> Vec<u8> {
        let width = self.width_bk as usize;
        let height = self.height_bk as usize;
        let mut rgb =  Vec::with_capacity(w * h * 4);

        let (mut idx, mut h, mut s, mut i, mut x, mut y, mut z);
        let two_third_pi = 2.0 / 3.0 * std::f64::consts::PI;
        let four_third_pi = 2.0 * two_third_pi;
        let tow_pi = 2 * std::f64::consts::PI;
        for row in 0..height {
            for col in 0..width {
                idx = (row * w + col) as usize;
                h = hsi[idx * 4 + 0];
                s = hsi[idx * 4 + 1];
                i = hsi[idx * 4 + 2];

                x = i * (1.0 - s);
                if h >= four_third_pi { // [240, 360]
                    h -= four_third_pi;
                    y = i * (1.0 + s * h.cos() / ((std::f64::consts::PI / 3.0) - h).cos());
                    z = 3.0 * i - (x + y);

                    rgb[idx * 4 + 0] = (z * 255) as u8; // todo: 最好用 & ff00 这个法子 clamp 一下
                    rgb[idx * 4 + 1] = (x * 255) as u8;
                    rgb[idx * 4 + 2] = (y * 255 ) as u8;
                } else if h >= two_third_pi { // [120, 240)
                    h -= two_third_pi;
                    y = i * (1.0 + s * h.cos() / ((std::f64::consts::PI / 3.0) - h).cos());
                    z = 3.0 * i - (x + y);

                    rgb[idx * 4 + 0] = (x * 255) as u8;
                    rgb[idx * 4 + 1] = (y * 255) as u8;
                    rgb[idx * 4 + 2] = (z * 255) as u8;
                } else { // [0, 120)
                    rgb[idx * 4 + 0] = (y * 255) as u8;
                    rgb[idx * 4 + 1] = (z * 255) as u8;
                    rbb[idx * 4 + 2] = (x * 255) as u8;
                }
            }
        }
        rgb
    }
}
