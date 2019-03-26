extern crate cfg_if;
extern crate wasm_bindgen;

mod utils;

use cfg_if::cfg_if;
use wasm_bindgen::prelude::*;

cfg_if! {
    // When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
    // allocator.
    if #[cfg(feature = "wee_alloc")] {
        extern crate wee_alloc;
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

#[wasm_bindgen]
pub struct Image {
    width: u32,
    height: u32,
    pixels: Vec<u8>, // the vec length is known, set it
    log: Vec<(f64, f64)>,
    corners: Vec<((u32, u32), (u32, u32), (u32, u32), (u32, u32))>
}

#[wasm_bindgen]
impl Image {
    pub fn new(w: u32, h: u32, buf: Vec<u8>) -> Image {
        let log = Vec::<_>::new();
        let corners = Vec::<_>::new();
        Image {
            width: w,
            height: h,
            pixels: buf,
            // log: vec![(1,1); 512 * 512]
            log,
            corners
        }
    }

    pub fn pixels(&self) -> *const u8 {
        self.pixels.as_ptr()
    }

    // 经常console中提示 webassembly out of memory, 是否用的久了, 之前的memory没有释放导致? 上线前, 务必不停的点击各功能, 连续使用半小时, 看看正常否
    // caller in JavaScript side need to call .pixels() to get a new buffer ptr after calling rotate()
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

    pub fn width(&self) -> u32 {
       self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn scale(&mut self) {
        let scaling_factor = 1.23456;
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
            interpolated = (y - tl.1 as f64).abs() * x_linear1 + (bl.1 as f64 - y).abs() * x_linear2;

            pixel_buf.push(interpolated as u8);
            //self.log.push((x_linear1, x_linear2))
        }
    }

    // sharpen(), smooth()
    pub fn contrast_enhance(&mut self) {

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
            let log_entry = format!("tl/tr/bl/br: ({:?}, {:?}, {:?}, {:?}), hehe: ", entry.0, entry.1, entry.2, entry.3);
            log.push_str(&log_entry);
        }
        log
    }

    pub fn show_me(&self) -> Vec<u8> {
        self.pixels[0..4].to_vec()
    }

}
