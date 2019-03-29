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

// todo: rename to sth else, all HSI related fn are included in this module

#[wasm_bindgen]
impl Image {
    pub fn rgb_to_hsi(&mut self) { // it's better to hide this fn, get called implicitly
        let width = self.width_bk as usize;
        let height = self.height_bk as usize;
        let size = width * height;
        self.hsi = vec![vec![0_f64; size], vec![0_f64; size], vec![0_f64; size]];

        let two_pi = 2.0 * std::f64::consts::PI;
        let (mut R, mut G, mut B, mut hue);

        for idx in 0..size {
            // normalize rgb value to [0, 1]
            // many online materials say: to normalise R/G/B into [0, 1], divide each value by (R+G+B)
            // but it's wrong, 255 should be the divisor
            R = self.pixels_bk[idx * 4 + 0] as f64 / 255.0;
            G = self.pixels_bk[idx * 4 + 1] as f64 / 255.0;
            B = self.pixels_bk[idx * 4 + 2] as f64 / 255.0;

            hue = (0.5 * ((R-G) + (R-B)) / (((R-G) * (R-G) + (R-B) * (G-B)).sqrt() + 0.001)).acos(); // adding 0.001 to avoid dividing by zero
            if B > G {
                self.hsi[0][idx] = two_pi - hue
            } else {
                self.hsi[0][idx] = hue
            }

            self.hsi[1][idx] = 1.0 - 3.0 / (R + G + B) * R.min(G).min(B); // saturation
            self.hsi[2][idx] = (R + G + B) / 3.0
        }
    }

    // Zero saturation would cause the img grayscale, so there is no need for an extra fn.
    // sat: saturation adjust, gain: contrast adjust, bias: brightness adjust
    pub fn adjust_hsi(&mut self, hue_adjust: f64, sat_adjust: f64, gain: f64, bias: f64) {
        // if gain is 1, don't adjust contrast.... at least do sth to avoid unnecessary calculation
        for intensity in self.hsi[2].iter_mut() {
            *intensity = (*intensity * gain + bias).max(0.0).min(1.0)
        }

        let (mut s, mut i) = (v&ec![0_f64;0], &vec![0_f64; 0]);
        if sat_adjust == 0.0 {
            saturation = &self.hsi[0]
        } else {
            // 可否用到Cow, 因为: either get a slice from hsi[0], or create a new one and reference to it
        }

        // self.hsi_to_rgb()
        self.hsi_to_rgb3(&self.hsi[0], s, i)
    }

    fn hsi_to_rgb3(&mut self, h: &[f64], s: &[f64], i: &[f64]) {

    }

    pub fn color_to_grayscale(&mut self) {

    }

    pub fn grayscale_to_color(&mut self) {
        
    }

    pub fn hsi_to_rgb(&mut self) {
        let (mut h, mut s, mut i, mut x, mut y, mut z);
        let two_third_pi = 2.0 / 3.0 * std::f64::consts::PI;
        let four_third_pi = 2.0 * two_third_pi;

        let get_y= |i: f64, s: f64, h: f64| -> f64 { i * (1.0 + s * h.cos() / (((std::f64::consts::PI / 3.0) - h).cos())) };
        let get_z = |i: f64, x: f64, y: f64| -> f64 {3.0 * i - (x + y)};

        for idx in 0..self.hsi[0].len() {
            h = self.hsi[0][idx]; // vector of hue
            s = self.hsi[1][idx]; // vector of saturation
            i = self.hsi[2][idx]; // vector of intensity, their length are the same

            x = i * (1.0 - s);

            if h >= four_third_pi { // [240, 360] degree
                h -= four_third_pi;
                y = get_y(i,s,h);
                z = get_z(i,x,y);

                self.pixels[idx * 4 + 0] = if z * 255.0 > 255.0 {255} else {(z * 255.0) as u8}; // todo: 最好用 & ff00 这个法子 clamp 一下
                self.pixels[idx * 4 + 1] = if x * 255.0 > 255.0 {255} else {(x * 255.0) as u8}; // todo: 想法子优化写法.
                self.pixels[idx * 4 + 2] = if y * 255.0 > 255.0 {255} else {(y * 255.0) as u8};
            } else if h >= two_third_pi { // [120, 240) degree
                h -= two_third_pi;
                y = get_y(i,s,h);
                z = get_z(i,x,y);

                self.pixels[idx * 4 + 0] = if x * 255.0 > 255.0 {255} else {(x * 255.0) as u8};
                self.pixels[idx * 4 + 1] = if y * 255.0 > 255.0 {255} else {(y * 255.0) as u8};
                self.pixels[idx * 4 + 2] = if z * 255.0 > 255.0 {255} else {(z * 255.0) as u8};
            } else { // [0, 120) degree
                y = get_y(i,s,h);
                z = get_z(i,x,y);
                self.pixels[idx * 4 + 0] = if y * 255.0 > 255.0 {255} else {(y * 255.0) as u8};
                self.pixels[idx * 4 + 1] = if z * 255.0 > 255.0 {255} else {(z * 255.0) as u8};
                self.pixels[idx * 4 + 2] = if x * 255.0 > 255.0 {255} else {(x * 255.0) as u8};
            }
        }
    }


    pub fn clear_hsi(&mut self) {
        self.hsi = vec![vec![], vec![], vec![]];
    }

    pub fn rgb_to_hsi2(&self) -> Vec<f64> {
        let width = self.width_bk as usize;
        let height = self.height_bk as usize;
        // let mut hsi =  Vec::with_capacity(width * height * 4); // vec![0_f64; w * h * 4]; // todo: I don't need the 4th alpha channel, how about w * h * 3
        let mut hsi = vec![255_f64; width * height * 4];

        let two_pi = 2.0 * std::f64::consts::PI;
        let (mut R, mut G, mut B, mut hue);
        for idx in 0..width * height {
            R = self.pixels_bk[idx * 4 + 0] as f64;
            G = self.pixels_bk[idx * 4 + 1] as f64;
            B = self.pixels_bk[idx * 4 + 2] as f64;
            // normalize rgb value to [0, 1]
            R /= 255.0; // many materials say: to normalise R/G/B into [0, 1], divide each value by (R+G+B)
            G /= 255.0; // but it's wrong, 255 should be the divisor
            B /= 255.0;

            let mut intensity = (R + G + B) / 3.0; // intensity, I increased intensity by 30% for testing the fn
            intensity = (intensity * 1.3).min(1.0);
            hsi[idx * 4 + 2] = intensity;
                hue = (0.5 * ((R-G) + (R-B)) / (((R-G) * (R-G) + (R-B) * (G-B)).sqrt() + 0.001)).acos(); // adding 0.001 to avoid dividing by zero
                hsi[idx * 4 + 1] = 1.0 - 3.0 / (R + G + B) * R.min(G).min(B);
                if B > G {
                    hsi[idx * 4 + 0] = two_pi - hue
                } else {
                    hsi[idx * 4 + 0] = hue
                }
        }
        hsi
    }

    pub fn hsi_to_rgb2(&self, hsi: &[f64]) -> Vec<u8> {
        let width = self.width_bk as usize;
        let height = self.height_bk as usize;
        let mut rgb = vec![0_u8; width * height * 4];

        let (mut h, mut s, mut i, mut x, mut y, mut z);
        let two_third_pi = 2.0 / 3.0 * std::f64::consts::PI;
        let four_third_pi = 2.0 * two_third_pi;
        for idx in 0..width * height {
            h = hsi[idx * 4 + 0];
            s = hsi[idx * 4 + 1];
            i = hsi[idx * 4 + 2];

            x = i * (1.0 - s);
            y = i * (1.0 + s * h.cos() / (((std::f64::consts::PI / 3.0) - h).cos()));
            z = 3.0 * i - (x + y);

            if h >= four_third_pi { // [240, 360] degree
                h -= four_third_pi;
                y = i * (1.0 + s * h.cos() / (((std::f64::consts::PI / 3.0) - h).cos()));
                z = 3.0 * i - (x + y);

                rgb[idx * 4 + 0] = if z * 255.0 > 255.0 {255} else {(z * 255.0) as u8}; // todo: 最好用 & ff00 这个法子 clamp 一下
                rgb[idx * 4 + 1] = if x * 255.0 > 255.0 {255} else {(x * 255.0) as u8}; // todo: 想法子优化写法.
                rgb[idx * 4 + 2] = if y * 255.0 > 255.0 {255} else {(y * 255.0) as u8};
            } else if h >= two_third_pi { // [120, 240) degree
                h -= two_third_pi;
                y = i * (1.0 + s * h.cos() / (((std::f64::consts::PI / 3.0) - h).cos()));
                z = 3.0 * i - (x + y);

                rgb[idx * 4 + 0] = if x * 255.0 > 255.0 {255} else {(x * 255.0) as u8};
                rgb[idx * 4 + 1] = if y * 255.0 > 255.0 {255} else {(y * 255.0) as u8};
                rgb[idx * 4 + 2] = if z * 255.0 > 255.0 {255} else {(z * 255.0) as u8};
            } else { // [0, 120) degree
                rgb[idx * 4 + 0] = if y * 255.0 > 255.0 {255} else {(y * 255.0) as u8};
                rgb[idx * 4 + 1] = if z * 255.0 > 255.0 {255} else {(z * 255.0) as u8};
                rgb[idx * 4 + 2] = if x * 255.0 > 255.0 {255} else {(x * 255.0) as u8};
            }
            rgb[idx * 4 + 3] = self.pixels_bk[idx * 4 + 3]; // todo: check whether this is the right one to read, should I read pixels[] ?
        }
        rgb
    }


    pub fn hsi_test(&mut self) {
        //let hsi = self.rgb_to_hsi();
        //self.pixels = self.hsi_to_rgb(&hsi);
    }
}
