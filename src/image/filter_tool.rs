extern crate wasm_bindgen;
extern crate web_sys;

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
        let mut top_x = top_x.max(0).min((img_width - 1) as i32) as u32; // todo: there are some similar code in transform/crop, update it as well
        let mut top_y = top_y.max(0).min((img_height - 1) as i32) as u32;
        let mut p_width = p_width.max(1).min(img_width);
        let mut p_height = p_height.max(1).min(img_height);

        if top_x + p_width > img_width as u32 || top_y + p_height > img_height as u32 {
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
        if x == 0 && y == 0 && width == 0 && height == 0 {
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

}
