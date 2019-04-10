extern crate wasm_bindgen;
extern crate web_sys;

use std::cmp;
use std::iter::Iterator;
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
    // Some code are just shamelessly copied from the following pages:
    // https://medium.com/@RoardiLeone/fast-image-blurring-algorithm-photoshop-level-w-c-code-87516d5cee87
    // http://blog.ivank.net/fastest-gaussian-blur.html
    pub fn gaussian_blur(&mut self, sigma: f64) {
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
        self.box_blur_v(&tgt, &mut src, box_size[2] / 2);
        self.pixels = src;
    }

    // todo: factor the following 2 fn into one
    fn box_blur_v(&mut self, src: &[u8], tgt: &mut [u8], radius: u32) {
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
                // running_sum.3 += src[idx2 * 4 + 3] as u32;
            }

            let idx = (row * img_width + col) as usize;
            tgt[idx * 4 + 0] = (running_sum.0 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 1] = (running_sum.1 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 2] = (running_sum.2 as f64 * avg).min(255.0).round() as u8;
            //tgt[idx * 4 + 3] = (running_sum.3 as f64 * avg).min(255.0).round() as u8;
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
        let mut box_sum = |row, col, start: i32, end: i32| {
            for idx in 0..(radius * 2 + 1) {
                let col = cmp::min(cmp::max(start + idx as i32, 0), img_width as i32 - 1);
                let idx2 = (row * img_width) as usize + col as usize;
                running_sum.0 += src[idx2 * 4 + 0] as u32;
                running_sum.1 += src[idx2 * 4 + 1] as u32;
                running_sum.2 += src[idx2 * 4 + 2] as u32;
                //running_sum.3 += src[idx2 * 4 + 3] as u32;
            }

            let idx = (row * img_width + col) as usize;
            tgt[idx * 4 + 0] = (running_sum.0 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 1] = (running_sum.1 as f64 * avg).min(255.0).round() as u8;
            tgt[idx * 4 + 2] = (running_sum.2 as f64 * avg).min(255.0).round() as u8;
            //tgt[idx * 4 + 3] = (running_sum.3 as f64 * avg).min(255.0).round() as u8;
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


    // Median filtering is implemented using:
    // https://pdfs.semanticscholar.org/6625/14a92ec7da77c8004b65dc559cc3a2b8a258.pdf
    // the traditional impl is too expensive, especially for big radius(>= 9)
    pub fn cartoonify(&mut self, radius: u32) { // radius: [1, 9, 1]
        self.median_filter(radius);
        self.edge_detect();
    }

    fn median_filter(&mut self, radius: u32) {
        let radius = if radius % 2 == 0 {radius + 1} else {radius};
        if radius > self.height / 2 || radius > self.width / 2 { // todo: add this check for all other filter operators
            log!("radius must at least larger than half of image width and height");
            return
        }
        // let radius = if radius % 2 == 0 {radius + 1} else {radius}; // as long as the width/height is "2 * radius + 1", radius doesn't have to be odd
        let img_width = self.width;
        let img_height = self.height;

        let mut histogram = vec![vec![0_u32; 256]; 3];
        let kernel_width = 2 * radius + 1;
        // initialize histogram, as if kernel center is sitting right on the top-left corner of image
        for row in (-1 * radius as i32)..(radius as i32 + 1) {
            for col in (-1 * radius as i32)..(radius as i32 + 1) {
                let idx = (row.max(0) * kernel_width as i32 + col.max(0)) as usize;
                let r = self.pixels_bk[idx * 4 + 0] as usize;
                let g = self.pixels_bk[idx * 4 + 1] as usize;
                let b = self.pixels_bk[idx * 4 + 2] as usize;
                histogram[0][r] += 1;
                histogram[1][g] += 1;
                histogram[2][b] += 1;
            }
        }
        log!("initialized histogram: {:?}\nkernel width, {:?}, radius: {:?}",histogram, kernel_width, radius);

        let mut update_hist_h = |row:u32, col:u32, histogram: &mut Vec<Vec<u32>>, pixels: &[u8]| {
            // let idx = row * img_width + col;
            for i in 0..kernel_width {
                let row1 = (row as i32 - radius as i32 + i as i32).max(0).min(img_height as i32 - 1) as u32;
                let col1 = (col + radius + 1).min(img_width - 1); // +1, we need to add the right-most column after current kernel
                let mut idx = (row1 * img_width + col1) as usize;
                //log!("row1: {:?}, col1: {:?}, idx: {:?}, originalRow-Col: {:?}/{:?}", row1, col1, idx, row, col);
                let r = pixels[idx * 4 + 0] as usize;
                let g = pixels[idx * 4 + 1] as usize;
                let b = pixels[idx * 4 + 2] as usize;
                histogram[0][r] += 1;
                histogram[1][g] += 1;
                histogram[2][b] += 1;

                let row2 = (row as i32 - radius as i32 + i as i32).max(0).min(img_height as i32 - 1) as u32; // todo: row1 and row2 are the same, reuse
                let col2 = (col as i32 - radius as i32).max(0) as u32;
                idx = (row2 * img_width + col2) as usize;
                let r = pixels[idx * 4 + 0] as usize;
                let g = pixels[idx * 4 + 1] as usize;
                let b = pixels[idx * 4 + 2] as usize;
                histogram[0][r] = if histogram[0][r] == 0 {0} else {histogram[0][r] - 1}; // if the histogram initialization is correct, there is no need to check, just subtract 1
                histogram[1][g] = if histogram[1][g] == 0 {0} else {histogram[1][g] - 1}; // todo: try to remove this if check, just use: -= 1;
                histogram[2][b] = if histogram[2][b] == 0 {0} else {histogram[2][b] - 1};
            }
        };

        // todo: 直接把col, row pass as i32
        let mut update_hist_v = |row:u32, col:u32, v_dir: i32, histogram: &mut Vec<Vec<u32>>, pixels: &[u8]| {
            let row1 = (row as i32 + radius as i32 * v_dir + 1 * v_dir).max(0).min(((img_height - 1) as i32)) as u32; // "1 * v_dir", we need to add the row above the top row, or below the bottom row
            let row2 = (row as i32 - radius as i32 * v_dir).max(0).min((img_height - 1) as i32) as u32; // row1 is for add, row2 is for remove

            for i in 0..kernel_width {
                let col1 = (col as i32 - radius as i32 + i as i32).max(0).min(img_width as i32 - 1) as u32;
                let mut idx = (row1 as u32 * img_width + col1) as usize;

                let r = pixels[idx * 4 + 0] as usize;
                let g = pixels[idx * 4 + 1] as usize;
                let b = pixels[idx * 4 + 2] as usize;
                histogram[0][r] += 1;
                histogram[1][g] += 1;
                histogram[2][b] += 1;

                let col2 = (col as i32 - radius as i32 + i as i32).max(0).min(img_width as i32 - 1) as u32; // todo: 2 col variables are the same, use one instead.
                idx = (row2 as u32 * img_width + col2) as usize;
                let r = pixels[idx * 4 + 0] as usize;
                let g = pixels[idx * 4 + 1] as usize;
                let b = pixels[idx * 4 + 2] as usize;
                histogram[0][r] = if histogram[0][r] == 0 {0} else {histogram[0][r] - 1}; // if the histogram initialization is correct, there is no need to check, just subtract 1
                histogram[1][g] = if histogram[1][g] == 0 {0} else {histogram[1][g] - 1}; // todo: try to remove this if check, just use: -= 1;
                histogram[2][b] = if histogram[2][b] == 0 {0} else {histogram[2][b] - 1};
            }
        };

        let mut v_dir = 1; // 1: top down, -1: bottom up
        let mut turned = true;
        for col in 0..img_width {
            let (mut top_down, mut bottom_up) = (0..img_height, (0..img_height).rev());
            let row_range = if v_dir == 1 { &mut top_down } else { &mut bottom_up as &mut Iterator<Item = _> };
            for row in row_range {
                // set_median(row, col, &histogram);

                let idx = (row * img_width + col) as usize;
                let limit = kernel_width * kernel_width / 2;
                let mut median= 0;
                let moved = true;
                for (color_channel, hist) in histogram.iter().enumerate() {
                    let mut running_sum = 0;
                    let limit = histogram[color_channel].iter().sum::<u32>() / 2;
                    for i in 0..256 {
                        running_sum += hist[i];
                        if running_sum > limit {
                            median = i;
                            break
                        }
                    }
                    // log!("gotcha, median: {:?}, original value: {:?}", median, self.pixels[idx * 4 + color_channel]);
                    // hist[idx] = median as u8;
                    // log!("pixel old/new value: {:?}/{:?}", self.pixels[idx * 4 + color_channel], median);
                    self.pixels[idx * 4 + color_channel] = median as u8;
                    // todo: sum of histogram is supposed to be a constant: kernel_width * kernel_width, but it's not, some lurking bug.
                    // I have to calculate the sum dynamically, then calculate the median.
                    // log!("histogram[0]: {:?}, and its sum {:?}", histogram[0], histogram[0].iter().sum::<u32>())
                }

                // log!("row/col: {:?}/{:?}", row, col)

                if row % (img_height - 1) != 0 { // bring the top(or bottom)-most row into kernel, and remove the other side
                    // log!("vertical move: {:?}", if v_dir == 1 {"top-down"} else {"bottom-up"});
                    update_hist_v(row, col, v_dir, &mut histogram, &self.pixels_bk)
                } else {
                    if turned {
                        // log!("vertical move: {:?}", if v_dir == 1 {"top-down"} else {"bottom-up"});
                        update_hist_v(row, col, v_dir, &mut histogram, &self.pixels_bk);
                        turned = false;
                    } else { // kernel center is at top(or bottom) of the img, bring into kernel the right most column, and remove the left most column
                        // log!("horizontal move");
                        update_hist_h(row, col, &mut histogram, &self.pixels_bk)   ;
                        turned = true;
                    }
                }
            }
            v_dir = -1 * v_dir;
        }
    }

    fn edge_detect(&mut self) {

    }


}
