extern crate wasm_bindgen;
extern crate web_sys;

use std::cmp;
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
    // blocksize 必须有最小/大值, 即使JS指定了, Rust中也要check, JS中设置在[3, 9] 之间就可以了.
    // 且drag/拖拉region时, 也要防止w/h比block还小.
    // 一定要check img size, 不要让block size比img还大, 用户可以open一个超级小的img.
    pub fn pixelate(&mut self, top_x: i32, top_y: i32, p_width: u32, p_height: u32, block_size: u32) {
        let img_width = self.width;
        let img_height = self.height;

        // validation check
        let top_x = top_x.max(0).min((img_width - 1) as i32) as u32; // todo: there are some similar code in transform/crop, update it as well
        let top_y = top_y.max(0).min((img_height - 1) as i32) as u32;
        let p_width = p_width.max(1).min(img_width);
        let p_height = p_height.max(1).min(img_height);

        if top_x + p_width > img_width as u32 || top_y + p_height > img_height as u32 {
            // validation check is done in JS, Rust check is to prevent panic.
            return
        }

        self.restore_area();

        let mut x; // X/Y position of pixelated region in original img
        let mut y;

        // save each pixel's coordinate in block
        let mut block_position = vec![(0_usize, 0_usize); (block_size * block_size) as usize];
        let mut block_avg;

        for row in (0..p_height).step_by(block_size as usize) {
            for col in (0..p_width).step_by(block_size as usize) {
                x = top_x as u32 + col;
                y = top_y as u32 + row;

                // if block_size is 5(width and height are both 5 pixels), and pixelated region is 25 * 31, \
                // then there are total 35 blocks.
                // this for-loop save all the x/y coordinate in current block in block_position vector
                for i in 0..block_size {
                    for j in 0..block_size {
                        block_position[(i * block_size as u32 + j) as usize] = (
                            // pixelated region's width/height is not probably the multiple of block size, \
                            // we need to make sure all the X/Y coordinates of block on last row/column don't go beyond the pixelated region
                            // when they do exceed, reuse the max one(top_x + p_width is the the position of the right border)
                            (x + j).min(top_x + p_width - 1) as usize,
                            (y + i).min(top_y + p_height - 1) as usize,
                        );
                    }
                }

                for offset in 0..3 {
                    block_avg = block_position.iter().fold(0_u32, |sum, (x,y)| -> u32 {
                        self.pixels_bk[ (*y * img_width as usize + *x) * 4 + offset ] as u32 + sum
                    });

                    block_avg = (block_avg as f64 / (block_size * block_size) as f64).round() as u32;

                    for (x, y) in block_position.iter() {
                        self.pixels[ (*y * img_width as usize + *x) * 4 + offset] = block_avg as u8;
                    }
                }
            }
        }
        self.restore_rect = (top_x, top_y, p_width, p_height)
        // we need to regenerate HSI, after user applying the changes, but it have to be invoked in JS
    }

    // when user move the pixelatedRegion, we need to restore the previous region to the original state, before applying the new changes.
    fn restore_area(&mut self) {
        let (x, y, width, height) = self.restore_rect;
        if x == 0 && y == 0 && width == 0 && height == 0 { // this is the initial value when Image object is created for the first time.
            return
        }

        let img_width = self.width;
        let img_height = self.height;
        let mut idx: usize;

        for row in y..(y+height) {
            for col in x..(x+width) {
                idx = (row * img_width + col) as usize;
                self.pixels[idx * 4 + 0] = self.pixels_bk[idx * 4 + 0];
                self.pixels[idx * 4 + 1] = self.pixels_bk[idx * 4 + 1];
                self.pixels[idx * 4 + 2] = self.pixels_bk[idx * 4 + 2];
            }
        }
    }

    // This is the approximation of Gaussian Blur, but faster.
    // Most of the code are just shamelessly copied from the following pages:
    // http://blog.ivank.net/fastest-gaussian-blur.html
    pub fn blur(&mut self, sigma: f64) {
        let num_pass = 3;
        let box_size = self.box_for_gaussian(sigma, num_pass);

        // todo: optimise, because I already have self.pixel, self.pixels_bk
        let mut src = self.pixels_bk.clone();
        let mut tgt: Vec<u8> = vec![0_u8; (self.width * self.height * 4) as usize];
        self.box_blur_h(&src, &mut tgt, box_size[0] / 2);
        self.box_blur_v(&tgt, &mut src, box_size[0] / 2);

        self.box_blur_h(&src, &mut tgt, box_size[1] / 2);
        self.box_blur_v(&tgt, &mut src, box_size[1] / 2);

        self.box_blur_h(&src, &mut tgt, box_size[2] / 2);
        self.box_blur_v(&tgt, &mut src, box_size[2] / 2); // todo: pass &self.pixels as target?????????
        self.pixels = src;
    }

    fn box_blur_v(&mut self, src: &[u8], tgt: &mut [u8], radius: u32) { // can I factor _h and _v into one fn????
        let radius = if radius % 2 == 0 {radius + 1} else {radius};
        let avg = 1.0 / (radius * 2 + 1) as f64;
        let img_width = self.width;
        let img_height = self.height;

        let mut running_sum = (0_u32, 0_u32, 0_u32, 0_u32);
        let mut box_sum = |row, col, start: i32, end: i32| {
            for idx in 0..(radius * 2 + 1) {
                let row = cmp::min(cmp::max(start + idx as i32, 0), img_height as i32 - 1) as u32;
                let idx2 = (row * img_width) as usize + col as usize;
                running_sum.0 += src[idx2 * 4 + 0] as u32;
                running_sum.1 += src[idx2 * 4 + 1] as u32;
                running_sum.2 += src[idx2 * 4 + 2] as u32;
                running_sum.3 += src[idx2 * 4 + 3] as u32;
            }

            let idx = (row * img_width + col) as usize;
            tgt[idx * 4 + 0] = (running_sum.0 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 1] = (running_sum.1 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 2] = (running_sum.2 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 3] = (running_sum.3 as f64 * avg).min(255.0).round() as u8;
            running_sum = (0_u32, 0_u32, 0_u32, 0_u32);
        };

        for col in 0..img_width {
            for row in 0..img_height {
                box_sum(row,col, row as i32 - radius as i32, row as i32 + radius as i32)
            }
        }
    }

    fn box_blur_h(&mut self, src: &[u8], tgt: &mut [u8], radius: u32) {
        let radius = if radius % 2 == 0 {radius + 1} else {radius};
        let avg = 1.0 / (radius * 2 + 1) as f64;
        let img_width = self.width;
        let img_height = self.height;

        let mut running_sum = (0_u32, 0_u32, 0_u32, 0_u32);
        let mut box_sum = |row, col, start: i32, end: i32| { // why I never use the 2nd 'col' argument???????? and re-declare a new one by shadowing it???????
            for idx in 0..(radius * 2 + 1) {
                let col = cmp::min(cmp::max(start + idx as i32, 0), img_width as i32 - 1); // todo: no need to check max::(), because it's always less than width
                let idx2 = (row * img_width) as usize + col as usize;
                running_sum.0 += src[idx2 * 4 + 0] as u32;
                running_sum.1 += src[idx2 * 4 + 1] as u32;
                running_sum.2 += src[idx2 * 4 + 2] as u32;
                running_sum.3 += src[idx2 * 4 + 3] as u32;
            }

            let idx = (row * img_width + col) as usize; // todo: can I reuse the start/end to calcuate the 'row'
            tgt[idx * 4 + 0] = (running_sum.0 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 1] = (running_sum.1 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 2] = (running_sum.2 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 3] = (running_sum.3 as f64 * avg).min(255.0).round() as u8;
            running_sum = (0_u32, 0_u32, 0_u32, 0_u32);
        };

        for row in 0..img_height {
            for col in 0..img_width {
                box_sum(row,col, col as i32 - radius as i32, col as i32 + radius as i32)
            }
        }





        /* failed attempt: try to reuse the .......
        let get_box_sum = |row, tail_idx| -> (u32, u32, u32, u32){
            let mut running_sum = (0_u32, 0_u32, 0_u32, 0_u32);
            // let idx = row * img_width;
            for idx in 0..(radius * 2 + 1) {
                let col = cmp::max(tail_idx + idx as i32, 0);
                let idx2 = (row * img_width) as usize + col as usize;
                running_sum.0 += src[idx2 * 4 + 0] as u32;
                running_sum.1 += src[idx2 * 4 + 1] as u32;
                running_sum.2 += src[idx2 * 4 + 2] as u32;
                running_sum.3 += src[idx2 * 4 + 3] as u32;
            }
            running_sum
        };

        // for this box: [-4, -3, -2, -1, 0, 1, 2, 3, 4], if radius is 3, the col is 0 in the first iteration of next for-loop
        for row in 0..img_height {
            let sum = get_box_sum(row, -1 * radius as i32 - 1); // radius is u32, multiplying by -1 still generate unsigned integer
            for col in 0..img_width {
                let idx = (row * img_width + col) as usize;
                // tail_idx = tail_idx.max(0).min(img_width - 1);
                let tail_idx = (col - radius - 1).max(0) as usize;
                let head_idx = (col + radius).min(img_width - 1) as usize;

                tgt[idx * 4 + 0] = ((sum.0 - src[tail_idx * 4 + 0] as u32 + src[head_idx * 4 + 0] as u32) as f64 * avg).min(255.0).round() as u8; // 貌似没必要check是否小于255
                tgt[idx * 4 + 1] = ((sum.1 - src[tail_idx * 4 + 1] as u32 + src[head_idx * 4 + 1] as u32) as f64 * avg).min(255.0).round() as u8;
                tgt[idx * 4 + 2] = ((sum.2 - src[tail_idx * 4 + 2] as u32 + src[head_idx * 4 + 2] as u32) as f64 * avg).min(255.0).round() as u8;
                tgt[idx * 4 + 3] = ((sum.3 - src[tail_idx * 4 + 3] as u32 + src[head_idx * 4 + 3] as u32) as f64 * avg).min(255.0).round() as u8;
            }
        }
        */


    }

    // this is just the help fn, which has nothing to do with self, can we move it into an util module?
    // sigma is the std deviation(how much blurry the img will be), for this fn, it means the radius of blur.
    // n is the number of box, or how many passes we need to run to approximate Gaussian blur.
    // In theory, when this number approaches Infinity, we get pure Gaussian blur.
    // In practice, 3 is a good balance between computation and blurring effect.
    fn box_for_gaussian(&self, sigma: f64, n: u32) -> Vec<u32> {
        // Ideal averaging filter width
        let w_ideal = ((12.0 * sigma * sigma / n as f64) + 1.0).sqrt();
        let mut wl: f64 = w_ideal.floor();

        if wl as u32 % 2 == 0 {
            wl -= 1.0;
        };
        let wu = wl + 2.0;

        let m_ideal = (12.0 * sigma * sigma - n as f64 * wl * wl - 4.0 * n as f64 * wl - 3.0 * n as f64) /
            (-4.0 * wl - 4.0);
        let m = m_ideal.round();

        let mut sizes:Vec<u32> = Vec::with_capacity(n as usize);
        for i in 0..n {
            if i < m as u32 {
                sizes.push(wl as u32);
            } else {
                sizes.push(wu as u32);
            }
        }
        sizes
    }


}
