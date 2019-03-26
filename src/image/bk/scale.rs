extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use std::cmp;
use super::Image;

#[wasm_bindgen]
impl Image {
    // todo: add percentage value(after scale) on the page,
    pub fn scale(&mut self) {
        let scaling_factor = 1.234986;
        let w = (self.width as f64 * scaling_factor).floor() as u32; // use floor to avoid out-of-bound-interpolation
        let h = (self.height as f64 * scaling_factor).floor() as u32;

        let mut new_pixels = Vec::with_capacity((w * h * 4) as usize);
        let mut pixel_buf = Vec::with_capacity(4);
        for row in 0..h {
            for col in 0..w {
                // why "* 0.9999"? 4 corner points are supposed to be on different rows, but due to rounding precision, sometimes they happen to be on the same line.
                // without multiplying 0.9999, the interpolated value would be zero due to the zero y-direction offset.
                // the bigger the image, the more .999(after decimal point) you need, otherwise, some pixels might not get covered, leaving holes in image.
                // I haven'n figured out a better way.

                // col is supposed to be x, row is supposed to be y, but why the inverse is true.
                self.bilinear_interpolate((row as f64 / scaling_factor) * 0.9999,(col as f64 / scaling_factor) * 0.9999, &mut pixel_buf);
                //self.log.push((col as f64 / scaling_factor, row as f64 / scaling_factor));
                new_pixels.append(&mut pixel_buf); // append() will leave the pixel_buf empty, ready for push in iteration.
            }
        }
        self.pixels = new_pixels;
        self.width = w;
        self.height = h;
    }

    // https://en.wikipedia.org/wiki/Bilinear_interpolation
    fn bilinear_interpolate(&self, x: f64, y: f64, pixel_buf: &mut Vec<u8>){ // if the scaling-down factor is too big, consider scaling it in stages, -> 75% -> 50% -> 25%
        let (mut tl, mut tr, mut bl, mut br) = ( // the 4 corner points around the to-be-interpolated pixel: "top_left, top_right, bottom_left, bottom_right"
            (x.floor() as u32, y.floor() as u32),
            (x.ceil() as u32, y.floor() as u32),
            (x.floor() as u32, y.ceil() as u32),
            (x.ceil() as u32, y.ceil() as u32)
        );

        let w = self.width;
        let h = self.height;

        // if tl.0 >= h { tl.0 = h - 1 }
        tl.0 = cmp::min(tl.0, h - 1);

        // if tl.1 >= w { tl.1 = w - 1 }
        tl.1 = cmp::min(tl.1, w - 1);

        //if tr.0 >= h { tr.0 = h - 1 }
        tr.0 = cmp::min(tr.0, h - 1);

        // if tr.1 >= w { tr.1 = w - 1 }
        tr.1 = cmp::min(tr.1, w - 1);

        // if bl.0 >= h { bl.0 = h - 1 }
        bl.0 = cmp::min(bl.0, h - 1);

        // if bl.1 >= w { bl.1 = w - 1 }
        bl.1 = cmp::min(bl.1, w - 1);

        // if br.0 >= h { br.0 = h - 1 }
        br.0 = cmp::min(br.0, h - 1);

        // if br.1 >= w { br.1 = w - 1 }
        br.1 = cmp::min(br.1, w - 1);

        let mut tl_pixel;
        let mut tr_pixel;
        let mut bl_pixel;
        let mut br_pixel;

        let mut x_linear1;
        let mut x_linear2;
        let mut interpolated;

        for color_channel in 0..4 {
            tl_pixel = self.pixels[ ((tl.0 * w + tl.1) * 4 + color_channel) as usize ];
            tr_pixel = self.pixels[ ((tr.0 * w + tr.1) * 4 + color_channel) as usize ];
            bl_pixel = self.pixels[ ((bl.0 * w + bl.1) * 4 + color_channel) as usize ];
            br_pixel = self.pixels[ ((br.0 * w + br.1) * 4 + color_channel) as usize ];

            x_linear1 = (br.0 as f64 - x).abs() * bl_pixel as f64 + (x - bl.0 as f64).abs() * br_pixel as f64;
            x_linear2 = (br.0 as f64 - x).abs() * tl_pixel as f64 + (x - bl.0 as f64).abs() * tr_pixel as f64;
            interpolated = (y - tl.1 as f64).abs() * x_linear1 + (bl.1 as f64 - y).abs() * x_linear2; // do I really need .abs()

            pixel_buf.push(interpolated as u8);
        }
    }

    fn bicubic_interpolate(&mut self, x: f64, y: f64, pixel_buf: &mut Vec<u8>) {

    }

}
