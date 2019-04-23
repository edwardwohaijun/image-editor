extern crate wasm_bindgen;
extern crate web_sys;

use wasm_bindgen::prelude::*;
use super::Image;
use super::Operation;

macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

#[wasm_bindgen]
impl Image {
    pub fn rgb_to_hsi(&mut self) { // this should not be public
        let width = self.width as usize;
        let height = self.height as usize;
        let size = width * height;
        self.hsi = vec![vec![0_f64; size], vec![0_f64; size], vec![0_f64; size]];

        let two_pi = 2.0 * std::f64::consts::PI;
        let (mut r, mut g, mut b, mut hue);

        for idx in 0..size {
            // normalize rgb value to [0, 1]
            // many online materials say: to normalise R/G/B into [0, 1], divide each value by (R+G+B)
            // but this is wrong, 255 should be the divisor
            r = self.pixels_bk[idx * 4 + 0] as f64 / 255.0;
            g = self.pixels_bk[idx * 4 + 1] as f64 / 255.0;
            b = self.pixels_bk[idx * 4 + 2] as f64 / 255.0;

            hue = (0.5 * ((r-g) + (r-b)) / (((r-g) * (r-g) + (r-b) * (g-b)).sqrt() + 0.001)).acos(); // adding 0.001 to avoid dividing by zero
            if b > g {
                hue = two_pi - hue
            }

            self.hsi[0][idx] = hue;
            self.hsi[1][idx] = 1.0 - 3.0 / (r + g + b) * r.min(g).min(b); // saturation
            self.hsi[2][idx] = (r + g + b) / 3.0 // intensity
        }
    }

    // first 2 arguments are the amount of hue and saturation to be adjusted to the current hsi,\
    // the 3rd argument is amount of temperature, it's not used in this fn, only get passed to the next hsi_to_rgb() call.
    // Then we convert back to rgb by calling hsi_to_rgb().
    // Intensity adjust is implemented in another fn: intensity_adjust().
    pub fn adjust_hsi(&mut self, h_amt: f64, s_amt: f64, t_amt: i32, grayscaled: bool, inverted: bool) {
        let width = self.width as usize;
        let height = self.height as usize;
        let two_pi = 2.0 * std::f64::consts::PI;

        let mut hue = vec![0_f64;0];
        // todo: adding an amount or multiplying an amount, which is more appropriate?
        let new_hue = |h: f64| -> f64 {
            if inverted {
                (two_pi - h + h_amt).min(two_pi).max(0.0)
            } else {
                (h + h_amt).min(two_pi).max(0.0)
            }
        };

        let hue_ref = if h_amt != 0.0 || inverted {
            hue = self.hsi[0].clone();
            for h in hue.iter_mut() {
                *h = new_hue(*h)
            }
            &hue
        } else {
            // if h_amt == 0.0, there is no need to self.hsi[0].clone(), \
            // just tell hsi_to_rgb() to use original hue vector in hsi[0], \
            // it'd be better to pass &self.hsi[0] as 1st argument to hsi_to_rgb(), \
            // but you can't create shared ref: "&self.hsi[0]" and use mutable ref: "self.hsi_to_rgb()" at the same time, \
            // thus, I pass the zero-lengthed ref to hsi_to_rgb() which'd check its length, \
            // use self.hsi[0] if hue_ref.len() is zero.
            // The same logic applies to saturation_ref and intensity_ref.
            &hue
            // &self.hsi[0] // here is the immutable ref, at the end of this fn, there is a mutable ref, so.....
        };

        let mut saturation = vec![0_f64;0];
        let saturation_ref = if grayscaled { // front-end will make sure grayscale and saturation-change won't occur at the same time
            saturation = vec![0_f64; width * height];
            &saturation
        } else if s_amt != 0.0 {
            saturation = self.hsi[1].clone();
            for s in saturation.iter_mut() {
                *s = (*s + s_amt).min(1.0).max(0.0);
            }
            &saturation
        } else {
            &saturation
        };

        let intensity_ref = &vec![0_f64;0];
        self.hsi_to_rgb(hue_ref, saturation_ref, intensity_ref, t_amt);
        self.last_operation = Operation::AdjustColor
    }

    // http://eng.usf.edu/~hady/courses/cap5400/rgb-to-hsi.pdf
    // how to make this accessible by other mod without exposing to JS
    // todo: move this into utils
    pub fn hsi_to_rgb(&mut self, hue: &[f64], saturation: &[f64], intensity: &[f64], t_amt: i32) {
        let width = self.width as usize;
        let height = self.height as usize;

        let (mut h, mut s, mut i, mut x, mut y, mut z);
        let t_amt = t_amt as f64 / 255 as f64;
        let two_third_pi = 2.0 / 3.0 * std::f64::consts::PI;
        let four_third_pi = 2.0 * two_third_pi;

        let get_y= |i: f64, s: f64, h: f64| -> f64 { i * (1.0 + s * h.cos() / (((std::f64::consts::PI / 3.0) - h).cos())) };
        let get_z = |i: f64, x: f64, y: f64| -> f64 {3.0 * i - (x + y)};

        let hue = if hue.len() == 0 { &self.hsi[0] } else { hue };
        let saturation = if saturation.len() == 0 { &self.hsi[1] } else { saturation };
        let intensity = if intensity.len() == 0 { &self.hsi[2] } else { intensity };

        let denormalize = |v: f64| -> u8 {
            let v = (v * 255.0).round();
            if v >= 255.0 { 255 } else { v as u8 }
        };

        for idx in 0..width * height {
            h = hue[idx];
            s = saturation[idx];
            i = intensity[idx]; // self.hsi[2][idx];

            x = i * (1.0 - s);

            if h >= four_third_pi { // [240, 360] degree
                h -= four_third_pi;
                y = get_y(i,s,h);
                z = get_z(i,x,y);

                self.pixels[idx * 4 + 0] = denormalize(z + t_amt);
                self.pixels[idx * 4 + 1] = denormalize(x);
                self.pixels[idx * 4 + 2] = denormalize(y - t_amt);
            } else if h >= two_third_pi { // [120, 240) degree
                h -= two_third_pi;
                y = get_y(i,s,h);
                z = get_z(i,x,y);

                self.pixels[idx * 4 + 0] = denormalize(x + t_amt);
                self.pixels[idx * 4 + 1] = denormalize(y);
                self.pixels[idx * 4 + 2] = denormalize(z - t_amt)
            } else { // [0, 120) degree
                y = get_y(i,s,h);
                z = get_z(i,x,y);
                self.pixels[idx * 4 + 0] = denormalize(y + t_amt);
                self.pixels[idx * 4 + 1] = denormalize(z);
                self.pixels[idx * 4 + 2] = denormalize(x - t_amt);
            }
        }
    }

    // gain: [0, 1]: shrink contrast, [1, ]: stretch contrast
    // bias: brightness adjust
    pub fn manual_adjust_intensity(&mut self, gain: f64, bias: f64) {
        let new_intensity = |v: &f64| -> f64 {
            let new_v = *v * gain + bias;
            new_v.min(1.0).max(0.0)
        };
        let intensity = self.hsi[2]
            .iter().map(new_intensity).collect::<Vec<_>>();
        let hue_ref = &vec![0_f64;0];
        let saturation_ref = &vec![0_f64;0];
        self.hsi_to_rgb(hue_ref, saturation_ref, &intensity, 0);
        self.last_operation = Operation::AdjustColor
    }

    pub fn auto_adjust_intensity(&mut self) {
        let mut intensity = self.hsi[2] // denormalized intensity into [0.0, 255.0]
            .iter()
            .map(|i| -> f64 {
                let v = (i * 255.0).round();
                if v > 255.0 {255.0} else {v}
            }).collect::<Vec<_>>();

        let mut intensity_dist = vec![0_f64; 256];
        let size = intensity.len();
        for idx in 0..size {
            intensity_dist[ intensity[idx] as usize ] += 1.0;
        }

        for i in intensity_dist.iter_mut() { // normalize number of occurrence to [0, 1]
            *i /= size as f64
        }

        let mut running_sum = 0.0;
        for idx in 1..256 { // in a nutshell, the value in intensity_dist is a Fibonacci sequence
            running_sum = (intensity_dist[idx] + intensity_dist[idx - 1]).min(1.0);
            intensity_dist[idx] = running_sum
        }

        // intensity vector's initial purpose is to generate intensity distribution,\
        // now I reuse it to generate the equalized intensity
        for i in intensity.iter_mut() {
            *i = intensity_dist[*i as usize]
        }
        // log!("new intensity vec: {:?}", intensity);

        let hue_ref = &vec![0_f64;0];
        let saturation_ref = &vec![0_f64;0];
        self.hsi_to_rgb(hue_ref, saturation_ref, &intensity, 0);
        self.last_operation = Operation::AdjustColor
    }

    // todo: move this into self.cleanup(), do a match before cleanup.
    // HSI is not used as frequently as RGB, thus when not used, JS will call this fn to clear the HSI data,\
    // is this really necessary?
    pub fn clear_hsi(&mut self) {
        self.hsi = vec![vec![], vec![], vec![]];
    }

}
