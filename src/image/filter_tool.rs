extern crate wasm_bindgen;
extern crate web_sys;

use std::cmp;
use std::iter::Iterator;
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
    // blocksize 必须有最小/大值, 即使JS指定了, Rust中也要check, JS中设置在[3, 9] 之间就可以了.
    // 且drag/拖拉region时, 也要防止w/h比block还小.
    // 一定要check img size, 不要让block size比img还大, 用户可以open一个超级小的img.
    pub fn pixelate(&mut self, top_x: i32, top_y: i32, p_width: u32, p_height: u32, block_size: u32, blur_type: &str) {
        let img_width = self.width;
        let img_height = self.height;

        // validation check
        let top_x = top_x.max(0).min((img_width - 1) as i32) as u32; // todo: there are some similar code in transform/crop, update it as well
        let top_y = top_y.max(0).min((img_height - 1) as i32) as u32;
        let p_width = p_width.max(1).min(img_width);
        let p_height = p_height.max(1).min(img_height);

        if top_x + p_width > img_width as u32 || top_y + p_height > img_height as u32 {
            // validation check is also done in JS, Rust check is to prevent panic.
            return
        }

        self.restore_area(false);
        if blur_type == "gaussian" {
            self.gaussian_blur(block_size as f64, top_x as i32, top_y as i32, p_width, p_height, false);
            return
        }

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
        self.last_operation = Operation::Pixelate {top_x, top_y, width: p_width, height: p_height}
        // we need to regenerate HSI, after user applying the changes, but it have to be invoked in JS
    }

    // when user move the pixelatedRegion/miniaturizedRegion, we need to restore the previous region to the original state, before applying the new changes.
    // is_top is for miniaturize only, this is anti-pattern, but I don't want to write 2 fn for similar cases.
    fn restore_area(&mut self, is_top: bool) {
        let img_width = self.width;
        let img_height = self.height;

        // I have made Operation enum Copy/Clone, otherwise, you can't move self.last_operation,\
        // making a ref doesn't work either, because inside match, restore closure will borrow mutably from self.
        let last_op = self.last_operation;
        let mut restore = |x, y, w, h| {
            let mut idx: usize;
            for row in y..(y + h) {
                for col in x..(x + w) {
                    idx = (row * img_width + col) as usize;
                    self.pixels[idx * 4 + 0] = self.pixels_bk[idx * 4 + 0];
                    self.pixels[idx * 4 + 1] = self.pixels_bk[idx * 4 + 1];
                    self.pixels[idx * 4 + 2] = self.pixels_bk[idx * 4 + 2];
                }
            }
        };

        match last_op {
            Operation::Pixelate {top_x, top_y, width, height} => {
                if top_x == 0 && top_y == 0 && width == 0 && height == 0 {return}

                restore(top_x, top_y, width, height)
            }
            Operation::Miniaturize {top_height, bottom_height} => {
                let top_x = 0;
                let top_y;
                let width = img_width;
                let height;
                if is_top {
                    top_y = 0;
                    height = top_height
                } else {
                    top_y = img_height - bottom_height;
                    height = bottom_height
                }
                restore(top_x, top_y, width, height)
            }
            _ => {return;}
        }
    }

    pub fn miniaturize(&mut self, sigma: f64, height: u32, is_top: bool) {
        let top_x = 0;
        let top_y = if is_top {0} else {self.height - height};

        let img_width = self.width;
        let img_height = self.height;
        if height > img_height || height == 0 {return}

        self.restore_area(is_top);
        self.gaussian_blur(sigma, top_x as i32, top_y as i32, img_width, height, false);

        // after applying the above gausssian_blur, there is a visual distinction in img between the blurred part and unblurred part,\
        // we need to, hhhr, blur this clear cut, or simply put, there must be a gradient from blurred part to unblurred part.
        // but the final result is not satisfactory, subtle noticeable border still exits, leave it to future improvement
        let gradient_height = (height as f64 * 0.20) as u32;
        let mut blur_ratio;
        let mut ratio_step= 1.0 / gradient_height as f64;
        let gradient_range;

        if is_top {
            blur_ratio = 1.0;
            gradient_range = (height - gradient_height)..height;
        } else {
            blur_ratio = 0.0;
            ratio_step *= -1.0;
            gradient_range = (self.height - height)..(self.height - height + gradient_height);
        }

        for row in gradient_range {
            blur_ratio -= ratio_step;
            for col in 0..img_width {
                let idx = (row * img_width + col) as usize;
                self.pixels[idx * 4 + 0] = (self.pixels[idx * 4 + 0] as f64 * blur_ratio + self.pixels_bk[idx * 4 + 0] as f64 * (1.0 - blur_ratio)).round() as u8;
                self.pixels[idx * 4 + 1] = (self.pixels[idx * 4 + 1] as f64 * blur_ratio + self.pixels_bk[idx * 4 + 1] as f64 * (1.0 - blur_ratio)).round() as u8;
                self.pixels[idx * 4 + 2] = (self.pixels[idx * 4 + 2] as f64 * blur_ratio + self.pixels_bk[idx * 4 + 2] as f64 * (1.0 - blur_ratio)).round() as u8;
            }
        }

        self.last_operation = match self.last_operation {
            // if last op is also miniaturize, we update the changed height, leave the other height unchanged
            Operation::Miniaturize {top_height, bottom_height} => {
                if is_top {
                    Operation::Miniaturize {top_height: height, bottom_height}
                } else {
                    Operation::Miniaturize {top_height, bottom_height: height}
                }
            }
            _ => { // last op is not miniaturize
                if is_top {
                    Operation::Miniaturize {top_height: height, bottom_height: 0}
                } else {
                    Operation::Miniaturize {top_height: 0, bottom_height: height}
                }

            }
        };
    }

    // this is a wrapper around gaussian_blur(), used for whole img blurring
    pub fn blur(&mut self, sigma: f64) {
        let (top_x, top_y, width, height, is_standalone) = (0, 0, self.width, self.height, true);
        self.gaussian_blur(sigma, top_x, top_y, width, height, is_standalone)
    }

    // This is the approximation of Gaussian Blur, but faster.
    // Some code are just shamelessly copied from the following:
    // https://medium.com/@RoardiLeone/fast-image-blurring-algorithm-photoshop-level-w-c-code-87516d5cee87
    // http://blog.ivank.net/fastest-gaussian-blur.html
    pub fn gaussian_blur(&mut self, sigma: f64, top_x: i32, top_y: i32, width: u32, height: u32, is_standalone: bool) {
        let mut top_x = top_x.max(0).min(self.width_bk as i32);
        let mut top_y = top_y.max(0).min(self.height_bk as i32);
        let mut width = width.min(self.width_bk);
        let height = height.min(self.height_bk);

        if top_x as u32 + width > self.width_bk {
            top_x = (self.width_bk - width) as i32
        }
        if top_y as u32 + height > self.height_bk {
            top_y = (self.height_bk - height) as i32
        }

        let img_width = self.width;
        let img_height = self.height;

        let whole_img_blur = if width == self.width && height == self.height {true} else {false};
        let mut tgt: Vec<u8> = vec![0_u8; (width * height) as usize * 4];
        let mut src = if whole_img_blur {
            self.pixels_bk.clone()
        } else {
            // to initialize the src with the top_x/y, width/height in self.pixels_bk,\
            // it might be a little faster than copy one pixel at a time.
            let mut src: Vec<u8> = Vec::with_capacity((width * height) as usize * 4);
            for r in 0..height {
                let start_idx = ((top_y as u32 + r) * img_width + top_x as u32) as usize;
                let end_idx = start_idx + width as usize;
                let row = &self.pixels_bk[(start_idx * 4)..(end_idx * 4)];
                src.extend_from_slice(row);
            }
            src
        };

        let num_pass = 3; // 3 passes is a good balance between Gaussian approximation and computation
        let box_size = self.box_for_gaussian(sigma, num_pass);
        for idx in 0..num_pass {
            self.box_blur_h(&src, &mut tgt, width, height, box_size[idx as usize] / 2);
            self.box_blur_v(&tgt, &mut src, width, height,box_size[idx as usize] / 2);
        }

        if whole_img_blur {
            self.pixels = src;
        } else {
            for row in 0..height {
                for col in 0..width {
                    let idx_img = ((top_y as u32 + row) * img_width + (top_x as u32 + col)) as usize;
                    let idx_box = (row * width + col) as usize;
                    self.pixels[idx_img * 4 + 0] = src[idx_box * 4 + 0];
                    self.pixels[idx_img * 4 + 1] = src[idx_box * 4 + 1];
                    self.pixels[idx_img * 4 + 2] = src[idx_box * 4 + 2];
                }
            }
        }

        // Miniaturize(and pixelate) will call gaussian_blur, but we don't want the last_op to be Gaussian
        if is_standalone {
            self.last_operation = Operation::GaussianBlur
        }
    }

    // todo: factor the following 2 fn into one, and since they have nothing to do with self, move it into utils mod.
    fn box_blur_v(&mut self, src: &[u8], tgt: &mut [u8], width: u32, height: u32, radius: u32) {
        let channel_count = (src.len() as f64 / (width * height) as f64) as u32;
        let channel_count = if channel_count >= 3 {4} else {1};
        let radius = if radius % 2 == 0 {radius + 1} else {radius};
        let avg = 1.0 / (radius * 2 + 1) as f64;

        let mut running_sum = vec![0_u32; channel_count as usize];
        let mut box_sum = |row: u32, col: u32, start: i32, end: i32| {
            for idx in 0..(radius * 2 + 1) {
                let row = cmp::min(cmp::max(start + idx as i32, 0), height as i32 - 1) as u32;
                let idx2 = (row * width) as usize + col as usize;
                for c in 0..channel_count {
                    running_sum[c] += src[idx2 * channel_count + c] as u32;
                }
            }

            let idx = (row * width + col) as usize;
            for c in 0..channel_count {
                tgt[idx * channel_count + c] = (running_sum[c] as f64 * avg).min(255.0).round() as u8;
                running_sum[c] = 0;
            }
        };

        for col in 0..width {
            for row in 0..height {
                box_sum(row,col, row as i32 - radius as i32, row as i32 + radius as i32)
            }
        }
    }

    fn box_blur_h(&mut self, src: &[u8], tgt: &mut [u8], width: u32, height: u32, radius: u32) {
        let channel_count = (src.len() as f64 / (width * height) as f64) as u32;
        let channel_count = if channel_count >= 3 {4} else {1};
        let radius = if radius % 2 == 0 {radius + 1} else {radius};
        let avg = 1.0 / (radius * 2 + 1) as f64;

        let mut running_sum = vec![0_u32; channel_count as usize];
        let mut box_sum = |row, col, start: i32, end: i32| {
            for idx in 0..(radius * 2 + 1) {
                let col = cmp::min(cmp::max(start + idx as i32, 0), width as i32 - 1);
                let idx2 = (row * width) as usize + col as usize;
                for c in 0..channel_count {
                    running_sum[c] += src[idx2 * channel_count + c] as u32;
                }
            }

            let idx = (row * width + col) as usize;
            for c in 0..channel_count {
                tgt[idx * channel_count + c] = (running_sum[c] as f64 * avg).min(255.0).round() as u8;
                running_sum[c]= 0;
            }
        };

        for row in 0..height {
            for col in 0..width {
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

    // Cartoonify need bilateral filter, whose naive impl is too expensive, but bilateral is just one of the whole procedure, \
    // how about downsampling the image to 1/4, doing BF, and other steps, then at the last step, upsampling to original size,\
    // cartoonifying need to quantize color, lose many details, ....
    /*
    pub fn cartoonify(&mut self, radius: u32, sigma_r: f64, iter_count: u32, incr: bool) { // radius: [1, 9, 1], use mnemonic name, like: range_sigma
        self.bilateral_filter(radius, sigma_r, iter_count, incr);

        // self.median_filter(radius);
        // self.edge_detect();
        // enhance edge
        self.last_operation = Operation::Cartoonify
    }
    */


    // Median filtering is implemented using:
    // https://pdfs.semanticscholar.org/6625/14a92ec7da77c8004b65dc559cc3a2b8a258.pdf
    // the traditional impl is too expensive, especially for big radius(>= 9)
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

    pub fn bilateral_filter(&mut self, radius: u32, sigma_r: f64, iter_count: u32, incr: bool) {
        // todo: add validity check, every arguments should have a range
        // when iter_count goes from 3 to 4(incr == true), we just need to run 1 more iteration(not 4) by reusing self.pixels()), \
        // which is the result of last 3 iterations.
        // "incr == false" means iter_count is decreasing, we have to use self.pixels_bk() and restart from scratch.
        let mut src = if incr {self.pixels.clone()} else {self.pixels_bk.clone()};
        let mut tgt = vec![255_u8; (self.width * self.height) as usize * 4];
        for _ in 0..iter_count {
            self.rgb_to_lab(&src);
            self.iterative_bf(&src, &mut tgt, radius, sigma_r);
            // target of each iteration is the source of next iteration
            std::mem::swap(&mut src, &mut tgt);
        }

        // if iter_count is odd, it looks like self.pixels should get assigned "tgt",\
        // but since there is a "std::mem::swap" at the end of for-loop iteration, so "src" should be assigned instead.
        self.pixels = if iter_count % 2 == 0 {tgt} else {src};
        self.last_operation = Operation::BilateralFilter // in JS, we call this operation SMOOTHEN
    }

    // small radius with more iter_count yielded results that are more aesthetically pleasing, \
    // and faster than larger radius with less iter_count.
    fn iterative_bf(&mut self, src: &[u8], tgt: &mut [u8], radius: u32, sigma_r: f64) {
        let sigma_d = radius as f64 / 2.0; // domain filter
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

        let range_kernel = |x: f64| {
            // let a = -0.5 * x * x / (sigma_r * sigma_r);
            // argument x should be squared before passing, then we do: "x * x" here
            // so, they cancel each other, you don't sqrt, I don't raise you to 2nd power.
            let a = -0.5 * x / (sigma_r * sigma_r);
            1.0_f64.exp().powf(a)
        };

        // https://sensing.konicaminolta.us/blog/identifying-color-differences-using-l-a-b-or-l-c-h-coordinates/
        let color_diff = |l1: f64, a1: f64, b1: f64, l2: f64, a2: f64, b2: f64| -> f64 {
            let delta_l = l1 - l2;
            let delta_a = a1 - a2;
            let delta_b = b1 - b2;
            // the diff will pass to range_kernel, which will multiply by itself, so don't bother sqrt-ing it here
            // I remembered, some articles say: the following is the correct diff
            // (delta_l * delta_l + delta_a * delta_a + delta_b * delta_b).sqrt() / (3.0_f64.sqrt())
            delta_l * delta_l + delta_a * delta_a + delta_b * delta_b
        };

        let img_width = self.width;
        let img_height = self.height;
        for row in 0..img_height {
            for col in 0..img_width {
                let mut weight = 0.0;
                let idx = (row * img_width + col) as usize;
                // let centroid_pixel = (src[idx * 4 + 0], src[idx * 4 + 1], src[idx * 4 + 2]);
                let mut new_value = (0.0, 0.0, 0.0);
                let (l1, a1, b1) = (self.lab[idx * 4 + 0], self.lab[idx * 4 + 1], self.lab[idx * 4 + 2]);

                for i in 0..kernel_size {
                    for j in 0..kernel_size {
                        let r = (row as i32 - radius as i32 + i as i32).max(0).min(img_height as i32 - 1) as usize;
                        let c = (col as i32 - radius as i32 + j as i32).max(0).min(img_width as i32 - 1) as usize;
                        let idx = r * img_width as usize + c;

                        let red = src[idx * 4 + 0];
                        let green = src[idx * 4 + 1];
                        let blue = src[idx * 4 + 2];

                        let (l2, a2, b2) = (self.lab[idx * 4 + 0], self.lab[idx * 4 + 1], self.lab[idx * 4 +2]);
                        let weight_domain = kernel[i * kernel_size + j];
                        let range_diff = color_diff(l1, a1, b1, l2, a2, b2);
                        // let range_diff = (((red + green + blue) as i32 - (centroid_pixel.0 + centroid_pixel.1 + centroid_pixel.2) as i32).abs() as f64 / 3.0);

                        let weight_range = range_kernel(range_diff);
                        let composite_weight = weight_domain * weight_range;

                        new_value.0 += red as f64 * composite_weight;
                        new_value.1 += green as f64 * composite_weight;
                        new_value.2 += blue as f64 * composite_weight;
                        weight += composite_weight;
                    }
                }
                tgt[idx * 4 + 0] = (new_value.0 / weight) as u8;
                tgt[idx * 4 + 1] = (new_value.1 / weight) as u8;
                tgt[idx * 4 + 2] = (new_value.2 / weight) as u8;
            }
        }
    }

    // modified from:
    // https://stackoverflow.com/questions/4593469/java-how-to-convert-rgb-color-to-cie-lab
    // L: [0, 100], a: [-128, 127] <-> [bluish green, pinkish magenta], b: [-128, 127] <-> [blue, yellow]
    fn rgb_to_lab(&mut self, rgb: &[u8]) {
        // cartoonifying effect need at least 4 iteration of bilateral filter,\
        // each iteration need a new Lab based on the new rgb, so we pass a rgb vector.
        let img_size = (self.width * self.height) as usize;
        if self.lab.len() != img_size * 4 {
            // L*a*b color space is only used in bilateral filter, JS will clear this vector when user is not doing anything Lab required.
            self.lab = vec![0_f64; img_size * 4]
        }
        let (mut r, mut g, mut b, mut X, mut Y, mut Z, mut xr, mut yr, mut zr);
        let Xr = 95.047;
        let Yr = 100.0;
        let Zr = 108.883;

        for idx in 0..(self.width * self.height) {
            // --------- RGB to XYZ ---------//
            r = rgb[idx as usize * 4 + 0] as f64 / 255.0;
            g = rgb[idx as usize * 4 + 1] as f64 / 255.0;
            b = rgb[idx as usize * 4 + 2] as f64 / 255.0;

            if r > 0.04045 {
                // r = Math.pow( (r+0.055) / 1.055, 2.4);
                r = ((r + 0.055) / 1.055).powf(2.4);
            } else {
                r /= 12.92;
            }

            if g > 0.04045 {
                // g = Math.pow((g+0.055)/1.055,2.4);
                g = ((g + 0.055) / 1.055).powf(2.4);
            } else {
                g /= 12.92;
            }

            if b > 0.04045 {
                // b = Math.pow((b+0.055)/1.055,2.4);
                b = ((b + 0.055) / 1.055).powf(2.4);
            } else {
                b /= 12.92 ;
            }

            r *= 100.0;
            g *= 100.0;
            b *= 100.0;

            X =  0.4124 * r + 0.3576 * g + 0.1805 * b;
            Y =  0.2126 * r + 0.7152 * g + 0.0722 * b;
            Z =  0.0193 * r + 0.1192 * g + 0.9505 * b;

            // --------- XYZ to Lab --------- //

            xr = X / Xr;
            yr = Y / Yr;
            zr = Z / Zr;

            if xr > 0.008856 {
                // xr =  (float) Math.pow(xr, 1/3.);
                xr = xr.powf(1.0/3.0)
            } else {
                // xr = (float) ((7.787 * xr) + 16 / 116.0);
                xr = ((7.787 * xr) + 16.0 / 116.0);
            }

            if yr > 0.008856 {
                // yr =  (float) Math.pow(yr, 1/3.);
                yr = yr.powf(1.0/3.0);
            } else {
                // yr = (float) ((7.787 * yr) + 16 / 116.0);
                yr = ((7.787 * yr) + 16.0 / 116.0);
            }

            if zr > 0.008856 {
                // zr = (float) Math.pow(zr, 1 / 3.);
                zr = zr.powf(1.0/3.0);
            } else {
                // zr = (float) ((7.787 * zr) + 16 / 116.0);
                zr = ((7.787 * zr) + 16.0 / 116.0);
            }

            self.lab[idx as usize * 4 + 0] = (116.0 * yr) - 16.0;
            self.lab[idx as usize * 4 + 1] = 500.0 * (xr - yr);
            self.lab[idx as usize * 4 + 2] = 200.0 * (yr - zr);
        }
    }

}
