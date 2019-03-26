extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use super::Image;

#[wasm_bindgen]
impl Image {
    /*
    pub fn intensity_dist(&self) -> String {
        let s = self.intensity_dist.clone();
        s
    }
    */

    pub fn set_contrast2(&mut self) {

    }

    // use Histogram equalization to enhance contrast.
    // pass a 2nd parameter, [-5, -4, -3, -1, 0, 1, 2, 3, 4, 5], 默认应该多少???
    pub fn set_contrast(&mut self) {
        let w = self.width as usize;
        let h = self.height as usize;

        // 3 items denote 3 RGB color channels
        let mut intensity_dist = vec![[0_f64; 256], [0_f64; 256], [0_f64; 256], [0_f64; 256]];
        let mut pixel_idx = 0;
        // get distribution of each pixel(number of occurrence), saved in intensity_dist.
        for row in 0..h {
            for col in 0..w {
                pixel_idx = row * w + col;
                for (idx, color_value) in self.pixels[pixel_idx * 4 .. pixel_idx * 4 + 4].iter().enumerate() {
                    intensity_dist[idx][*color_value as usize] += 1.0;
                }
            }
        }

        // normalise number of occurrence to [0, 1].
        let total_pixel_num = (w * h) as f64;
        for color_channel in intensity_dist.iter_mut() {
            for intensity in color_channel.iter_mut() {
                *intensity /= total_pixel_num
            }
        }

        let mut intensity_dist2 = vec![0_f64; 256];
        for intensity in 0..256 as usize {
            intensity_dist2[intensity] = (intensity_dist[0][intensity] + intensity_dist[1][intensity] + intensity_dist[2][intensity]) / 3.0;
        }

        let mut current_item;
        let mut last_item = intensity_dist2[255];
        intensity_dist2[255] = 1.0;
        for idx in (1..255).rev() {
            current_item = intensity_dist2[idx];
            if intensity_dist2[idx + 1] - last_item < 0.0 {
                intensity_dist2[idx] = 0.0
            } else {
                intensity_dist2[idx] = intensity_dist2[idx + 1] - last_item
            }
            last_item = current_item
        }



        // convert A: [0, 0.1, 0.2, 0.3, 0.1, ...] to
        //         B: [0, 0.1, 0.3, 0.6, 0.7, ...],
        // each item in B is the the sum of all preceding items in A (yes, Fibonacci sequence)
        // all items in A sum up to 1.0, because each item in A is the probability of each pixel value in the whole image.
        // B, in fact, is a cumulative distribution function(CDF).
        // I don't want to create 2 vectors for A and B, so intensity_dist vector is used to store pixel distribution(A values),
        // then update its item in-place to CDF value(B values).
        // the last item in B is a fixed 1.0, thus subtract the last item in A is the second-to-last item in B, repeat this process backward to the beginning of A
        /*
        let mut last_item;
        let mut current_item;
        for color_channel in intensity_dist.iter_mut() {
            last_item = color_channel[255];
            color_channel[255] = 1.0;
            for idx in (1..255).rev() {
                current_item = color_channel[idx];
                if color_channel[idx + 1] - last_item < 0.0 { // 貌似一开始, 没做此判断, 图形也是失真的, 故: 不加这个if判断, 应该也没啥影响.
                    color_channel[idx] = 0.0
                } else {
                    color_channel[idx] = color_channel[idx + 1] - last_item;
                }
                last_item = current_item
            }
        }
        */

/*
        let mut color_channel_log = String::new();
        for color_channel in &intensity_dist {
            let sum: f64 = color_channel.iter().sum();
            let mut s = format!("color channel sum: {:?}, and elements: {:?}", sum,  color_channel.to_vec());
            s.push('\n');
            s.push('\n');
            color_channel_log.push_str(&s)
        }
        self.intensity_dist = color_channel_log;
*/

        let mut pixel_value;
        let mut new_pixel_value;
        for row in 0..h {
            for col in 0..w {
                pixel_idx = row * w + col;

                pixel_value = self.pixels[pixel_idx * 4 + 0];
                new_pixel_value = intensity_dist2[pixel_value as usize] * 255 as f64;
                if new_pixel_value > 255.0 {
                    self.pixels[pixel_idx * 4 + 0] = 255
                } else {
                    self.pixels[pixel_idx * 4 + 0] = new_pixel_value.round() as u8
                }

                pixel_value = self.pixels[pixel_idx * 4 + 1];
                new_pixel_value = intensity_dist2[pixel_value as usize] * 255 as f64;
                if new_pixel_value > 255.0 {
                    self.pixels[pixel_idx * 4 + 1] = 255
                } else {
                    self.pixels[pixel_idx * 4 + 1] = new_pixel_value.round() as u8
                }

                pixel_value = self.pixels[pixel_idx * 4 + 2];
                new_pixel_value = intensity_dist2[pixel_value as usize] * 255 as f64;
                if new_pixel_value > 255.0 {
                    self.pixels[pixel_idx * 4 + 2] = 255
                } else {
                    self.pixels[pixel_idx * 4 + 2] = new_pixel_value.round() as u8
                }

                /*
                pixel_value = self.pixels[pixel_idx * 4 + 3];
                new_pixel_value = (intensity_dist[3][pixel_value as usize] * 256 as f64) as u8;
                self.pixels[pixel_idx * 4 + 3] = new_pixel_value;
*/

                /*
                for (idx, color_value) in self.pixels[pixel_idx * 4 .. pixel_idx * 4 + 4].iter_mut().enumerate() {
                    *color_value = 220 as u8
                    // *color_value = (256 as f64 * intensity_dist[idx][*color_value as usize]).round() as u8
                }
                */
            }
        }

    }
}
