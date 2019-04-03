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
    // topX/Y position, width/height of pixelated rectangular
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

        log!("ta da: x/y/w/h/blockSize: {}/{}/{}/{}/{}", top_x, top_y, p_width, p_height, block_size);

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
                // idx = (top_y * img_width) + top_x
                //x = (top_y as u32 + row) * img_width + (top_x as u32 + col);
                //y = top_y as u32 + row;
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
