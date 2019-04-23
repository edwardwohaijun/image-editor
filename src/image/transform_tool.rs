extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use std::cmp;
use super::Image;
use super::Operation;

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
        let width = width.min(self.width_bk);
        let height = height.min(self.height_bk);

        if top_x as u32 + width > self.width_bk {
            top_x = (self.width_bk - width) as i32
        }
        if top_y as u32 + height > self.height_bk {
            top_y = (self.height_bk - height) as i32
        }

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
        self.last_operation = Operation::Transform
    }

    pub fn rotate(&mut self, clockwise: bool) { // rotate 90
        let (w, h) = (self.width as usize, self.height as usize);

        let mut new_pixels = vec![0_u8; w * h * 4];
        let mut new_x;
        let mut new_y;
        let mut new_idx: usize;
        let mut current_idx: usize;

        for row in 0..h {
            for col in 0..w {
                new_x = if clockwise { h - 1 - row } else { row };
                new_y = if clockwise { col } else { w - 1 - col };
                new_idx = new_y * h + new_x; // new image's height is original image's width
                current_idx = row * w + col;

                new_pixels[new_idx * 4 + 0] = self.pixels[current_idx * 4 + 0];
                new_pixels[new_idx * 4 + 1] = self.pixels[current_idx * 4 + 1];
                new_pixels[new_idx * 4 + 2] = self.pixels[current_idx * 4 + 2];
                new_pixels[new_idx * 4 + 3] = self.pixels[current_idx * 4 + 3];
            }
        }
        self.pixels = new_pixels;
        self.width = h as u32;
        self.height = w as u32;
        self.last_operation = Operation::Transform
    }

    pub fn rotate_by(&mut self) { // rotate by a specified degree
        // to be implemented
        self.last_operation = Operation::Transform
    }

    // flip the image vertically
    pub fn flip_v(&mut self) {
        let (w, h) = (self.width as usize, self.height as usize);

        let mut rows: Vec<&mut [u8]> = self.pixels.chunks_mut(w * 4).collect();
        let mut tmp_row= vec![0_u8; w * 4];
        let tmp_row_ref = tmp_row.as_mut_slice();
        for row_idx in 0..(h/2) {
            rows[row_idx].swap_with_slice(tmp_row_ref);
            rows[h - row_idx - 1].swap_with_slice(tmp_row_ref);
            rows[row_idx].swap_with_slice(tmp_row_ref);
        }
        self.last_operation = Operation::Transform
    }

    // flip the image horizontally
    pub fn flip_h(&mut self) {
        let w = self.width as usize;
        let mut tmp_row = vec![0_u32; w];
        let tmp_row_ref = tmp_row.as_mut_slice();

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
        self.last_operation = Operation::Transform
    }

    pub fn scale(&mut self, factor: f64) {
        // it's better to pass width/height as argument rather than scalingFactor to prevent rounding error,\
        // besides, this lock the aspect ratio.
        if factor == 1.0 {
            self.pixels = self.pixels_bk.clone();
            self.width = self.width_bk;
            self.height = self.height_bk;
            return;
        }

        let w = (self.width_bk as f64 * factor).floor() as u32; // use floor to avoid out-of-bound-interpolation
        let h = (self.height_bk as f64 * factor).floor() as u32;

        let mut new_pixels = Vec::with_capacity((w * h * 4) as usize);
        let mut pixel_buf = Vec::with_capacity(4);
        for row in 0..h {
            for col in 0..w {
                // why "* 0.9999"? 4 corner points are supposed to be on different rows, but due to rounding precision, sometimes they happen to be on the same line.
                // without multiplying 0.9999, the interpolated value would be zero due to the zero y-direction offset.
                // the bigger the image, the more .999(after decimal point) you need, otherwise, some pixels might not get covered, leaving holes in image.
                // I haven'n figured out a better way.

                // col is supposed to be x, row is supposed to be y, but why the inverse is true?
                self.bilinear_interpolate((row as f64 / factor) * 0.9999,(col as f64 / factor) * 0.9999, &mut pixel_buf);
                new_pixels.append(&mut pixel_buf); // append() will leave the pixel_buf empty, ready for push in iteration.
            }
        }

        self.pixels = new_pixels;
        self.width = w;
        self.height = h;
        self.last_operation = Operation::Transform
    }

    // todo: move this into util modules as an independent fn
    // https://en.wikipedia.org/wiki/Bilinear_interpolation
    fn bilinear_interpolate(&self, x: f64, y: f64, pixel_buf: &mut Vec<u8>){ // if the scaling-down factor is too big, consider scaling it in stages, -> 75% -> 50% -> 25%
        let (mut tl, mut tr, mut bl, mut br) = ( // the 4 corner points around the to-be-interpolated pixel: "top_left, top_right, bottom_left, bottom_right"
                                                 (x.floor() as u32, y.floor() as u32),
                                                 (x.ceil() as u32, y.floor() as u32),
                                                 (x.floor() as u32, y.ceil() as u32),
                                                 (x.ceil() as u32, y.ceil() as u32)
        );

        let w = self.width_bk;
        let h = self.height_bk;

        tl.0 = cmp::min(tl.0, h - 1);
        tl.1 = cmp::min(tl.1, w - 1);
        tr.0 = cmp::min(tr.0, h - 1);
        tr.1 = cmp::min(tr.1, w - 1);
        bl.0 = cmp::min(bl.0, h - 1);
        bl.1 = cmp::min(bl.1, w - 1);
        br.0 = cmp::min(br.0, h - 1);
        br.1 = cmp::min(br.1, w - 1);

        let mut tl_pixel;
        let mut tr_pixel;
        let mut bl_pixel;
        let mut br_pixel;

        let mut x_linear1;
        let mut x_linear2;
        let mut interpolated;

        for color_channel in 0..4 {
            tl_pixel = self.pixels_bk[ ((tl.0 * w + tl.1) * 4 + color_channel) as usize ];
            tr_pixel = self.pixels_bk[ ((tr.0 * w + tr.1) * 4 + color_channel) as usize ];
            bl_pixel = self.pixels_bk[ ((bl.0 * w + bl.1) * 4 + color_channel) as usize ];
            br_pixel = self.pixels_bk[ ((br.0 * w + br.1) * 4 + color_channel) as usize ];

            x_linear1 = (br.0 as f64 - x).abs() * bl_pixel as f64 + (x - bl.0 as f64).abs() * br_pixel as f64;
            x_linear2 = (br.0 as f64 - x).abs() * tl_pixel as f64 + (x - bl.0 as f64).abs() * tr_pixel as f64;
            interpolated = (y - tl.1 as f64).abs() * x_linear1 + (bl.1 as f64 - y).abs() * x_linear2; // do I really need .abs()

            pixel_buf.push(interpolated as u8);
        }
    }

    /*
    fn bicubic_interpolate(&mut self, x: f64, y: f64, pixel_buf: &mut Vec<u8>) {

    }
    */

}
