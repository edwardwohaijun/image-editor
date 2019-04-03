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
    pub fn pixelate(&mut self, top_x: i32, top_y: i32, p_width: u32, p_height: u32, block_size: u32) {
        let mut top_x = top_x.max(0).min(self.width as i32);
        let mut top_y = top_y.max(0).min(self.height as i32);
        let mut p_width = p_width.min(self.width);
        let mut p_height = p_height.min(self.height);

        if top_x as u32 + p_width > self.width {
            top_x = (self.width - p_width) as i32
        }
        if top_y as u32 + p_height > self.height {
            top_y = (self.height - p_height) as i32
        }

        let img_width = self.width;
        let img_height = self.height;

        let shrunk_width = p_width - p_width % block_size;
        let shrunk_height = p_height - p_height % block_size;
        let mut x;
        let mut y; // X/Y position in original img, not the ones in pixelated region

        // save each pixel's coordinate in block
        let mut block_position = vec![(0_usize, 0_usize); (block_size * block_size) as usize];
        // let mut block_red = vec![(0_usize, 0_usize); (block_size * block_size) as usize];
        // let mut block_green = vec![(0_usize, 0_usize); (block_size * block_size) as usize];
        // let mut block_blue = vec![(0_usize, 0_usize); (block_size * block_size) as usize];
        //log!("")
        let mut block_avg;
        // let mut new_hue = self.hsi[0].clone();
        // let mut new_saturation = self.hsi[1].clone();
        // let mut new_intensity = self.hsi[2].clone();

        for row in (0..shrunk_height).step_by(block_size as usize) {
            for col in (0..shrunk_width).step_by(block_size as usize) {
                x = top_x as u32 + col;
                y = top_y as u32 + row;

                // if block_size is 5(width and height are both 5 pixels), and pixelated region is 25 * 31, \
                // then there are total 35 blocks, the block height of last row is 1(not 5).
                // this for-loop save all the x/y coordinate in current block in block_position vector
                for i in 0..block_size {
                    for j in 0..block_size {
                        block_position[(i * block_size as u32 + j) as usize] = (
                            (x + j).min(img_width - 1) as usize, // ????????????????????????
                            (y + i).min(img_height - 1) as usize // need comment
                        )
                    }
                }

                // todo: factor all 3 for-loop into one.
                // read all RED value in block, coordinate is from block_position, calculate the average RED, then write into pixel
                block_avg = block_position.iter().fold(0_u32, |sum, (x,y)| -> u32 { self.pixels_bk[ (*y * img_width as usize + *x) * 4 + 0 ] as u32 + sum});
                block_avg = (block_avg as f64 / (block_size * block_size) as f64).round() as u32;
                for (x, y) in block_position.iter() {
                    self.pixels[(*y * img_width as usize + *x) * 4 + 0] = block_avg as u8;
                }
                // ***********************

                block_avg = block_position.iter().fold(0_u32, |sum, (x,y)| -> u32 { self.pixels_bk[ (*y * img_width as usize + *x) * 4 + 1 ] as u32 + sum});
                block_avg = (block_avg as f64 / (block_size * block_size) as f64).round() as u32;
                for (x, y) in block_position.iter() {
                    self.pixels[(*y * img_width as usize + *x) * 4 + 1] = block_avg as u8;
                }
                // ************************

                block_avg = block_position.iter().fold(0_u32, |sum, (x,y)| -> u32 { self.pixels_bk[ (*y * img_width as usize + *x) * 4 + 2 ] as u32 + sum});
                block_avg = (block_avg as f64 / (block_size * block_size) as f64).round() as u32;
                for (x, y) in block_position.iter() {
                    self.pixels[(*y * img_width as usize + *x) * 4 + 2] = block_avg as u8;
                }
            }
        }
        // self.hsi_to_rgb(&new_hue, &new_saturation, &new_intensity, 0);
        // todo: don't forget to re-generate HSI, IS THIS REALLY NECESSARY????
    }

    // topX/Y position, width/height of pixelated rectangular
    pub fn pixelate2(&mut self, top_x: i32, top_y: i32, p_width: u32, p_height: u32, block_size: u32) {
        let mut top_x = top_x.max(0).min(self.width as i32);
        let mut top_y = top_y.max(0).min(self.height as i32);
        let mut p_width = p_width.min(self.width);
        let mut p_height = p_height.min(self.height);

        if top_x as u32 + p_width > self.width {
            top_x = (self.width - p_width) as i32
        }
        if top_y as u32 + p_height > self.height {
            top_y = (self.height - p_height) as i32
        }

        let img_width = self.width;
        let img_height = self.height;

        let shrunk_width = p_width - p_width % block_size;
        let shrunk_height = p_height - p_height % block_size;
        let mut x;
        let mut y; // X/Y position in original img, not the ones in pixelated region

        // save each pixel's coordinate in block
        let mut block = vec![(0_usize, 0_usize); (block_size * block_size) as usize];
        //log!("")
        let mut block_avg;
        let mut new_hue = self.hsi[0].clone();
        let mut new_saturation = self.hsi[1].clone();
        let mut new_intensity = self.hsi[2].clone();
        for row in (0..shrunk_height).step_by(block_size as usize) {
            for col in (0..shrunk_width).step_by(block_size as usize) {
                x = top_x as u32 + col;
                y = top_y as u32 + row;

                for i in 0..block_size {
                    for j in 0..block_size {
                        block[(i * block_size as u32 + j) as usize] = ((x + j).min(img_width - 1) as usize, (y + i).min(img_height - 1) as usize)
                    }
                }

                block_avg = block.iter().fold(0.0, |sum, (x,y)| -> f64 { new_hue[ *y * img_width as usize + *x ] + sum});
                block_avg /= (block_size * block_size) as f64;
                for (x, y) in block.iter() {
                    new_hue[ *y * img_width as usize + *x ] = block_avg;
                }
                // ***********************

                block_avg = block.iter().fold(0.0, |sum, (x,y)| -> f64 { new_saturation[ *y * img_width as usize + *x ] + sum});
                block_avg /= (block_size * block_size) as f64;
                for (x, y) in block.iter() {
                    new_saturation[ *y * img_width as usize + *x ] = block_avg;
                }
                // ************************

                block_avg = block.iter().fold(0.0, |sum, (x,y)| -> f64 { new_intensity[ *y * img_width as usize + *x ] + sum});
                block_avg /= (block_size * block_size) as f64;
                for (x, y) in block.iter() {
                    new_intensity[ *y * img_width as usize + *x ] = block_avg;
                }
            }
        }
        self.hsi_to_rgb(&new_hue, &new_saturation, &new_intensity, 0);
    }


}
