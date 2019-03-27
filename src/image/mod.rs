extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

use std::ops::Mul;
use std::ops::Add;
use std::default::Default;

mod scale;
mod rotate;
mod compress;
mod set_contrast;
mod set_brightness;
mod crop;
mod flip;
mod rgb_to_grayscale;

#[wasm_bindgen]
pub struct Image {
    width: u32,
    height: u32,
    pixels: Vec<u8>,

    pixels_bk: Vec<u8>,
    width_bk: u32,
    height_bk: u32,

    dct: (Vec<f64>, Vec<f64>),
}

#[wasm_bindgen]
impl Image {
    pub fn new(w: u32, h: u32, buf: Vec<u8>) -> Image {
        let dct = Self::initialise_DCT();
        Image {
            width: w,
            height: h,
            pixels: buf.clone(),

            pixels_bk: buf,
            width_bk: w,
            height_bk: h,

            dct,
        }
    }

    // reuse the current image obj
    // there is an expensive initialise_DCT() call in ctor, I don't want to call it every time a new Image obj is created(open/fetch a new img file), hence the reuse
    // Although DCT is not used in this impl.
    pub fn reuse(&mut self, w: u32, h: u32, buf: Vec<u8>) {
        self.pixels = buf.clone();
        self.width = w;
        self.height = h;

        self.pixels_bk = buf;
        self.width_bk = w;
        self.height_bk = h;

    }

    pub fn pixels(&self) -> *const u8 {
        self.pixels.as_ptr()
    }
    pub fn width(&self) -> u32 { self.width }
    pub fn height(&self) -> u32 { self.height }
    pub fn width_bk(&self) -> u32 { self.width_bk }
    pub fn height_bk(&self) -> u32 { self.height_bk }

    pub fn apply_change(&mut self) {
        self.pixels_bk = self.pixels.clone();
        self.width_bk = self.width;
        self.height_bk = self.height;
    }

    pub fn discard_change(&mut self) {
        self.pixels = self.pixels_bk.clone();
        self.width = self.width_bk;
        self.height = self.height_bk;
    }

    pub fn show_pixels(&self) -> String{
        // println!("all pixels: {:?}", self.pixels)
        format!("all pixels/len: {:?}/{:?}", self.pixels.len(), self.pixels)
    }

    pub fn free_draw(&mut self) {

    }

    // looks like DCT is for JPEG, what about PNG/GIF, or even SVG?
    // add a filter to only allow JPEG/PNG when click "file" element.

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
        s
    }

    // todo: move it into util module
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

    pub fn estimated_size(&self) -> u32 {
        100
    }

    // sharpen(), smooth()
    pub fn contrast_enhance(&mut self) {

    }

    pub fn undo(&mut self) {

    }

    pub fn show_me(&self) -> Vec<u8> {
        self.pixels[0..4].to_vec()
    }

}
