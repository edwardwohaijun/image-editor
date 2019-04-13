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
    pub fn cartoonify(&mut self, radius: u32, sigma_r: f64) { // radius: [1, 9, 1], use mnemonic name, like: range_sigma
        self.bilateral_filter(radius, sigma_r);
        // self.median_filter(radius);
        // self.edge_detect();
        // enhance edge
        //
    }

    fn median_filter(&mut self, radius: u32) {
        let radius = if radius % 2 == 0 {radius + 1} else {radius};
        if radius > self.height / 2 || radius > self.width / 2 { // todo: add this check for all other filter operators
            log!("radius must at least larger than half of image width and height");
            return
        }

        let kernel_width = 2 * radius + 1;
        let img_width = self.width;
        let img_height = self.height;
        let mut histogram = vec![vec![0_u32; 256]; 3];
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

        // row, col, radius are supposed to be u32, but used as i32, because, \
        // if 'row < radius', 'row - radius' will get wrapped around, and give you a super big u32, rather than a negative value. \
        // for general use purpose, positive part of i32 is bigger enough for image width/height
        let mut update_hist_h = |row: i32, col: i32, histogram: &mut Vec<Vec<u32>>, pixels: &[u8]| {
            let radius = radius as i32;
            let (mut r, mut g, mut b);
            let mut idx;
            for i in 0..kernel_width {
                let row_to_add = (row - radius + i as i32).max(0).min(img_height as i32 - 1) as u32;
                let col_to_add = (col + radius + 1).min(img_width as i32 - 1) as u32; // (col + radius +1): we need to add the right-most column after current kernel
                idx = (row_to_add * img_width + col_to_add) as usize;
                r = pixels[idx * 4 + 0] as usize;
                g = pixels[idx * 4 + 1] as usize;
                b = pixels[idx * 4 + 2] as usize;
                histogram[0][r] += 1;
                histogram[1][g] += 1;
                histogram[2][b] += 1;

                // let row_to_remove = (row as i32 - radius as i32 + i as i32).max(0).min(img_height as i32 - 1) as u32;
                // row_to_remove is the same as row_to_add, reuse it.
                let col_to_remove = (col - radius).max(0) as u32;
                idx = (row_to_add * img_width + col_to_remove) as usize;
                r = pixels[idx * 4 + 0] as usize;
                g = pixels[idx * 4 + 1] as usize;
                b = pixels[idx * 4 + 2] as usize;
                histogram[0][r] = if histogram[0][r] == 0 {0} else {histogram[0][r] - 1};
                histogram[1][g] = if histogram[1][g] == 0 {0} else {histogram[1][g] - 1};
                histogram[2][b] = if histogram[2][b] == 0 {0} else {histogram[2][b] - 1};
            }
        };

        let mut update_hist_v = |row: i32, col: i32, v_dir: i32, histogram: &mut Vec<Vec<u32>>, pixels: &[u8]| {
            let radius = radius as i32;
            let row_to_add = (row + radius * v_dir + 1 * v_dir).max(0).min(((img_height - 1) as i32)) as u32; // "1 * v_dir", we need to add the row above the top row, or below the bottom row
            let row_to_remove = (row - radius * v_dir).max(0).min((img_height - 1) as i32) as u32;
            let (mut r, mut g, mut b);
            let mut idx;
            for i in 0..kernel_width {
                let col_to_add = (col - radius + i as i32).max(0).min(img_width as i32 - 1) as u32;
                idx = (row_to_add * img_width + col_to_add) as usize;

                r = pixels[idx * 4 + 0] as usize;
                g = pixels[idx * 4 + 1] as usize;
                b = pixels[idx * 4 + 2] as usize;
                histogram[0][r] += 1;
                histogram[1][g] += 1;
                histogram[2][b] += 1;

                // let col_to_remove = (col as i32 - radius as i32 + i as i32).max(0).min(img_width as i32 - 1) as u32;
                // col_to_remove is the same as col_to_add, reuse it
                idx = (row_to_remove * img_width + col_to_add) as usize;
                r = pixels[idx * 4 + 0] as usize;
                g = pixels[idx * 4 + 1] as usize;
                b = pixels[idx * 4 + 2] as usize;
                histogram[0][r] = if histogram[0][r] == 0 {0} else {histogram[0][r] - 1};
                histogram[1][g] = if histogram[1][g] == 0 {0} else {histogram[1][g] - 1};
                histogram[2][b] = if histogram[2][b] == 0 {0} else {histogram[2][b] - 1};
            }
        };

        let mut v_dir = 1; // 1: top down, -1: bottom up
        let mut turned = true;
        // when kernel center is sitting on bottom(or top) edge of image, we need to turn right, then go up(or down).
        // So we need 'turned' bool to distinguish when to turn right, when to go up/down, \
        // then, call following "update_hist_h" or "update_hist_v".
        for col in 0..img_width {
            let (mut top_down, mut bottom_up) = (0..img_height, (0..img_height).rev());
            let row_range = if v_dir == 1 { &mut top_down } else { &mut bottom_up as &mut Iterator<Item = _> };
            for row in row_range {
                let idx = (row * img_width + col) as usize;
                let mut median= 0;
                for (color_channel, hist) in histogram.iter().enumerate() {
                    let mut running_sum = 0;
                    // tofix: sum of histogram is supposed to be a constant: kernel_width * kernel_width, but it's not in my code, what went wrong?
                    // I have to calculate the sum dynamically, then find the median.
                    // let limit = kernel_width * kernel_width / 2;
                    // after fix, histogram[0][r/g/b] -= 1 (in the above 2 update_hist() fn) could be used, rather than cumbersome less-than-zero check.
                    let limit = histogram[color_channel].iter().sum::<u32>() / 2;
                    for i in 0..256 {
                        running_sum += hist[i];
                        if running_sum > limit {
                            median = i;
                            break
                        }
                    }
                    self.pixels[idx * 4 + color_channel] = median as u8;
                }

                if row % (img_height - 1) != 0 { // bring the top(or bottom)-most row into kernel, and remove the row on the other side
                    update_hist_v(row as i32, col as i32, v_dir, &mut histogram, &self.pixels_bk)
                } else {
                    if turned {
                        update_hist_v(row as i32, col as i32, v_dir, &mut histogram, &self.pixels_bk);
                        turned = false;
                    } else { // kernel center is at top(or bottom) of the img, bring into kernel the right most column, and remove the left most column
                        update_hist_h(row as i32, col as i32, &mut histogram, &self.pixels_bk)   ;
                        turned = true;
                    }
                }
            }
            v_dir = -1 * v_dir;
        }
    }

    fn edge_detect(&mut self) {
        let w = self.width;
        let h = self.height;
        let img_size = w * h;

        let gray_pixels = (0..img_size).into_iter().map(|idx|
            (self.pixels[idx as usize * 4 + 0] as f64 * 0.2989
                + self.pixels[idx as usize * 4 + 1] as f64 * 0.5870
                + self.pixels[idx as usize * 4 + 2] as f64 * 0.1140).round() as u8
        ).collect::<Vec<_>>(); // 255.0 * 0.2989 + 255.0 * 0.5870 + 255.0 * 0.1140 = 254.9744999, so there is no need to do .max(255.0) clamp




    }

    fn bilateral_filter(&mut self, radius: u32, sigma_r: f64) {
        let sigma_d = radius as f64 / 2.0;
        // let sigma = 0.84089642; // just a test
        // let sigma_d = 3.0; // sigma for domain filter
        let gaussian = |x: i32, y: i32| {
            // https://en.wikipedia.org/wiki/Gaussian_blur
            let a = -0.5 * ((x * x) as f64  + (y * y) as f64) / (sigma_d * sigma_d);
            1.0_f64.exp().powf(a)
        };

        let mut kernel_value = 0.0;
        let kernel_size = 2 * radius as usize + 1;
        let mut kernel = Vec::with_capacity(kernel_size * kernel_size);
        for row in 0..kernel_size{
            for col in 0..kernel_size {
                kernel_value = gaussian(row as i32 - radius as i32, col as i32 - radius as i32);
                kernel.push(kernel_value);
            }
        }
        // log!("kernel: {:?}", kernel);

        let kernel_sum = kernel.iter().sum::<f64>();
        // for k in kernel.iter_mut() { *k /= kernel_sum };

        //let sigma_r = 20.0; // sigma for range filter
        let range_kernel = |x: u32| {
            let a = -0.5 * x as f64 * x as f64 / (sigma_r * sigma_r);
            1.0_f64.exp().powf(a)
        };

        let img_width = self.width;
        let img_height = self.height;
        for row in 0..img_height {
            for col in 0..img_width {
                // let mut sum = (0_f64, 0_f64, 0_f64);
                let mut weight = (0.0, 0.0, 0.0);
                let idx = (row * img_width + col) as usize;
                let cur_pixel = (self.pixels_bk[idx * 4 + 0], self.pixels_bk[idx * 4 + 1], self.pixels_bk[idx * 4 + 2]);
                let mut new_value = (0.0, 0.0, 0.0);

                for i in 0..kernel_size {
                    for j in 0..kernel_size {
                        let r = (row as i32 - radius as i32 + i as i32).max(0).min(img_height as i32 - 1) as usize;
                        let c = (col as i32 - radius as i32 + j as i32).max(0).min(img_width as i32 - 1) as usize;
                        let idx = r * img_width as usize + c;

                        let red = self.pixels_bk[idx * 4 + 0];
                        let green = self.pixels_bk[idx * 4 + 1];
                        let blue = self.pixels_bk[idx * 4 + 2];

                        let weight_domain = kernel[i * kernel_size + j];
                        // in theory, it's better to use LAB color space, then calculate: sqrt(L*L + a*a + b*b)
                        let range_diff = (red as i32 - cur_pixel.0 as i32).abs();
                        let weight_range = range_kernel(range_diff as u32); // 是否需要考虑 == 0; == 255 的edge case.
                        let composite_weight = weight_domain * weight_range;

                        new_value.0 += red as f64 * composite_weight;
                        new_value.1 += green as f64 * composite_weight;
                        new_value.2 += blue as f64 * composite_weight;

                        weight.0 += composite_weight;
                        weight.1 += composite_weight;
                        weight.2 += composite_weight;
                    }
                }
                self.pixels[idx * 4 + 0] = (new_value.0 / weight.0 as f64) as u8;
                self.pixels[idx * 4 + 1] = (new_value.1 / weight.1 as f64) as u8;
                self.pixels[idx * 4 + 2] = (new_value.2 / weight.2 as f64) as u8;
            }
        }

    }

}
