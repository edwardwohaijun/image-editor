extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

use std::ops::Mul;
use std::ops::Add;
use std::default::Default;

#[wasm_bindgen]
pub struct Image {
    width: u32,
    height: u32,
    pixels: Vec<u8>,
    dct: (Vec<f64>, Vec<f64>),
    log: Vec<(f64, f64)>,
    corners: Vec<((u32, u32), (u32, u32), (u32, u32), (u32, u32))>
}

#[wasm_bindgen]
impl Image {
    pub fn new(w: u32, h: u32, buf: Vec<u8>) -> Image {
        let dct = Self::initialise_DCT();
        let log = Vec::<_>::new();
        let corners = Vec::<_>::new();
        Image {
            width: w,
            height: h,
            pixels: buf,
            dct,
            log,
            corners
        }
    }

    pub fn pixels(&self) -> *const u8 {
        self.pixels.as_ptr()
    }

    pub fn rotate(&mut self) {
        let w = self.width;
        let h = self.height;

        let mut new_pixels = vec![0_u8; (w * h * 4) as usize];
        let mut new_x;
        let mut new_y;
        let mut new_idx;
        let mut current_idx;

        for row in 0..h {
            for col in 0..w {
                new_x = h - 1 - row;
                new_y = col;
                new_idx = new_y * h + new_x; // new image's height is original image's width
                current_idx = row * w + col;

                new_pixels[(new_idx * 4 + 0) as usize] = self.pixels[(current_idx * 4 + 0) as usize];
                new_pixels[(new_idx * 4 + 1) as usize] = self.pixels[(current_idx * 4 + 1) as usize];
                new_pixels[(new_idx * 4 + 2) as usize] = self.pixels[(current_idx * 4 + 2) as usize];
                new_pixels[(new_idx * 4 + 3) as usize] = self.pixels[(current_idx * 4 + 3) as usize];
            }
        }

        self.pixels = new_pixels;
        self.width = h;
        self.height = w;
    }

    /*
    pub fn width(&self) -> u32 {
        self.width
    }
    pub fn height(&self) -> u32 {
        self.height
    }
*/

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

    pub fn show_pixels(&self) -> String{
        // println!("all pixels: {:?}", self.pixels)
        format!("all pixels/len: {:?}/{:?}", self.pixels.len(), self.pixels)
    }

    // https://en.wikipedia.org/wiki/Bilinear_interpolation
    fn bilinear_interpolate(&mut self, x: f64, y: f64, pixel_buf: &mut Vec<u8>){ // if the scaling-down factor is too big, consider scaling it in stages, -> 75% -> 50% -> 25%
        let (mut tl, mut tr, mut bl, mut br) = ( // the 4 corner points around the to-be-interpolated pixel: "top_left, top_right, bottom_left, bottom_right"
                                                 (x.floor() as u32, y.floor() as u32),
                                                 (x.ceil() as u32, y.floor() as u32),
                                                 (x.floor() as u32, y.ceil() as u32),
                                                 (x.ceil() as u32, y.ceil() as u32)
        );
        //self.corners.push((tl, tr, bl, br));

        let w = self.width;
        let h = self.height;

        if tl.0 >= h { tl.0 = h - 1 }
        if tl.1 >= w { tl.1 = w - 1 }

        if tr.0 >= h { tr.0 = h - 1 }
        if tr.1 >= w { tr.1 = w - 1 }

        if bl.0 >= h { bl.0 = h - 1 }
        if bl.1 >= w { bl.1 = w - 1 }

        if br.0 >= h { br.0 = h - 1 }
        if br.1 >= w { br.1 = w - 1 }

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
            interpolated = (y - tl.1 as f64).abs() * x_linear1 + (bl.1 as f64 - y).abs() * x_linear2; // todo: do I really need .abs()

            pixel_buf.push(interpolated as u8);
        }
    }

    fn bicubic_interpolate(&mut self, x: f64, y: f64, pixel_buf: &mut Vec<u8>) {

    }

    pub fn free_draw(&mut self) {

    }

    // looks like DCT is for JPEG, what about PNG/GIF, or even SVG?
    // add a filter to only allow JPEG/PNG when click "file" element.
    //

    // quality is between 10 ~ 100. When img is loaded, its quality is 100, thus,
    // passing 100 would reload the img, without bothering going through all the compression steps
    fn quantization_matrix(quality: i32) -> Vec<u8> {
        let quality_50: Vec<u8> = vec![
            16, 11, 10, 16, 24,  40,  51,  61,
            12, 12, 14, 19, 26,  58,  60,  55,
            14, 13, 16, 24, 40,  57,  69,  56,
            14, 17, 22, 29, 51,  87,  80,  62,
            18, 22, 37, 56, 68,  109, 103, 77,
            24, 35, 55, 64, 81,  104, 113, 92,
            49, 64, 78, 87, 103, 121, 120, 101,
            72, 92, 95, 98, 112, 100, 103, 99
        ];
        let mut v:f64 = 0.0;
        let result = match quality {
            q if q > 50 => {
                quality_50.into_iter().map(|item| {
                    ((item as i32 * (100 - q)) as f64/50 as f64).round() as u8 // they are definitely inside [0, 255]
                }).collect()
            }
            q if q < 50 => {
                quality_50.into_iter().map(|item| {
                    v = (item as f64 * (50 as f64/q as f64)).round();
                    if v > 255.0 { 255 as u8 } else { v as u8 } // 255.5 rounded to 256, which get wrapped around to 0 if 'as u8' is directly applied
                } ).collect()
            }
            _ => quality_50
        };

        result
    }

    pub fn show_quantization_matrix(&self, quality: i32) -> String {
        let q = Self::quantization_matrix(70);
        let mut s = String::new();
        s.push('\n');
        for (idx, item) in q.iter().enumerate() {
            let item_str = format!("{:?},", item);
            s.push_str(&item_str);
            if (1 + idx) % 8 == 0 {
                s.push('\n')
            }
        }
        s
    }

    fn initialise_DCT() -> (Vec<f64>, Vec<f64>) {
        const N: usize = 8;
        let mut dct = vec![0_f64; N * N];
        let first_row = 1 as f64/(N as f64).sqrt();
        for item in dct.iter_mut().take(N) {
            *item = first_row
        }


        for i in 1..N {
            for j in 0..N {
                dct[ i * N + j] = (2 as f64 / N as f64).sqrt() * ((( 2*j + 1) as f64 * (i as f64 * std::f64::consts::PI)) / (2 * N) as f64).cos()
            }
        }

        let mut transposed = dct.clone();
        let mut tmp;
        for i in 0..8 {
            for j in 0..8 {
                if j > i {
                    tmp = transposed[i * 8 + j];
                    transposed[i * 8 + j] = transposed[j * 8 + i];
                    transposed[j * 8 + i] = tmp
                }
            }
        }
        (dct, transposed)
    }

    pub fn show_dct(&self) -> String{
        let mut s = String::new();
        for (idx, item) in self.dct.0.iter().enumerate() {
            s.push_str(&item.to_string());
            s.push(',');
            if idx % 7 == 0 {
                s.push('\n')
            }
        }
        // format!("dct: {:?}", self.dct.0)
        s
    }

    fn multiply_matrix<T>(buf: &mut [T], m1: &[T], m2: &[T])
        where T: Add<Output=T> + Mul<Output=T> + Default + Copy
    { // m1 and m2 are supposed to be a slice of 64 elements
        let mut m1_iter;
        let mut m2_iter;
        for row in 0..8 {
            for col in 0..8 {
                m1_iter = m1.iter().skip(row * 8).take(8);
                m2_iter = m2.iter().skip(col).step_by(8);
                buf[row * 8 + col] = m1_iter.zip(m2_iter).fold(T::default(), |sum, item| sum + *item.0 * *item.1)
            }
        }

    }
    pub fn test_multiply(&self) -> String {
        let v1 = vec![
            1,2,3,4,5,6,7,8,
            9,10,11,12,13,14,15,16,
            17,18,19,20,21,22,23,24,
            25,26,27,28,29,30,31,32,
            33,34,35,36,37,38,39,40,
            41,42,43,44,45,46,47,48,
            49,50,51,52,53,54,55,56,
            57,58,59,60,61,62,63,64
        ];
        let v2 = vec![
            9,10,11,12,13,14,15,16,
            17,18,19,20,21,22,23,24,
            25,26,27,28,29,30,31,32,
            33,34,35,36,37,38,39,40,
            41,42,43,44,45,46,47,48,
            49,50,51,52,53,54,55,56,
            57,58,59,60,61,62,63,64,
            65,66,67,68,69,70,71,72
        ];
        let mut result = vec![0; 64];
        Self::multiply_matrix(&mut result, &v1, &v2);
        let s = format!("{:?}", result);
        s
    }

    // too much computation to put into practical use, use a sample input for testing only
    // https://www.math.cuhk.edu.hk/~lmlui/dct.pdf
    pub fn compress(&mut self, quality: i32) -> String { // quality: 1 ~ 10 corresponds to 10 ~ 100
        let input: Vec<u8> = vec![
            154, 123, 123, 123, 123, 123, 123, 136,
            192, 180, 136, 154, 154, 154, 136, 110,
            254, 198, 154, 154, 180, 154, 123, 123,
            239, 180, 136, 180, 180, 166, 123, 123,
            180, 154, 136, 167, 166, 149, 136, 136,
            128, 136, 123, 136, 154, 180, 198, 154,
            123, 105, 110, 149, 136, 136, 180, 166,
            110, 136, 123, 123, 123, 136, 154, 136,
        ];

        let leveled_off_input: Vec<_> = input.iter().map(|item| (*item as i32 - 128) as f64).collect();
        let (dct, transposed_dct) = &self.dct;
        let mut buf = vec![0.0; 64];
        Self::multiply_matrix(&mut buf, dct, &leveled_off_input);
        let mut intermediate_result = buf.clone();
        Self::multiply_matrix(&mut buf, &intermediate_result, transposed_dct);

        let quantization_matrix = Self::quantization_matrix(50);
        let mut quantization_result = vec![0_f64; 64];
        for (idx, item) in quantization_result.iter_mut().enumerate() {
            *item = (buf[idx] / quantization_matrix[idx] as f64).round();
            *item = *item * quantization_matrix[idx] as f64; // decompress stage begins here, I just don't want to call another for-loop
        }

        Self::multiply_matrix(&mut buf, transposed_dct, &quantization_result);
        intermediate_result = buf.clone();
        Self::multiply_matrix(&mut buf, &intermediate_result, dct);

        let mut output = vec![0_u8; 64];
        // let mut tmp;
        for (idx, item) in output.iter_mut().enumerate() {
            *item = (buf[idx] + 128 as f64).round() as u8 // it's possible that 255.6 would get rounded to 256, then wrapped to 0 due to 'as u8' downcast.
        }

        let s = format!("{:?}", output);
        s

        // create a new_pixels vector with the width/height being multiple of 8
        // run split_mut_at on this vector to generate an iterator of mutable ref to each row, mut_at() is
        // passed a closure which split at row end
        // while iterating over each mutable row ref, call copy_from_slice() to copy the data from old pixel vec
    }

    /*
    pub fn show_leveled_off_pixels(&self) -> String {
        let mut s = String::new();
        for
    }
    */

    pub fn estimated_size(&self) -> u32 {

        100
    }

    // sharpen(), smooth()
    pub fn contrast_enhance(&mut self) {

    }

    pub fn undo(&mut self) {

    }

    pub fn crop(&mut self) {

    }

    pub fn log(&self) -> String{
        let mut log= String::new();
        for entry in &self.log {
            let log_entry = format!("x/y: {:?}/{:?}, ", entry.0, entry.1);
            log.push_str(&log_entry);
        }
        log
    }

    pub fn corners(&self) -> String{
        let mut log = String::new();
        for entry in &self.corners {
            let log_entry = format!("tl/tr/bl/br: ({:?}, {:?}, {:?}, {:?}). ", entry.0, entry.1, entry.2, entry.3);
            log.push_str(&log_entry);
        }
        log
    }

    pub fn show_me(&self) -> Vec<u8> {
        self.pixels[0..4].to_vec()
    }

}
