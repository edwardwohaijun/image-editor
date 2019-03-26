extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;
use super::Image;

#[wasm_bindgen]
impl Image {
    // too much computation to put into practical use, use a sample input for testing only
    // https://www.math.cuhk.edu.hk/~lmlui/dct.pdf
    pub fn compress(&self, quality: i32) -> String { // quality: 1 ~ 10 corresponds to 10 ~ 100
    let input: Vec<u8> = vec![
        154, 123, 123, 123, 123, 123, 123, 136,
        192, 180, 136, 154, 154, 154, 136, 110,
        254, 198, 154, 154, 180, 154, 123, 123,
        239, 180, 136, 180, 180, 166, 123, 123,
        180, 154, 136, 167, 166, 149, 136, 136,
        128, 136, 123, 136, 154, 180, 198, 154,
        123, 105, 110, 149, 136, 136, 180, 166,
        110, 136, 123, 123, 123, 136, 154, 136,
    ];

    let leveled_off_input: Vec<_> = input.iter().map(|item| (*item as i32 - 128) as f64).collect();
    let (dct, transposed_dct) = &self.dct;
    let mut buf = vec![0.0; 64];
    Self::multiply_matrix(&mut buf, dct, &leveled_off_input);
    let mut intermediate_result = buf.clone();
    Self::multiply_matrix(&mut buf, &intermediate_result, transposed_dct);

    let quantization_matrix = Self::quantization_matrix(50);
    let mut quantization_result = vec![0_f64; 64];
    for (idx, item) in quantization_result.iter_mut().enumerate() {
        *item = (buf[idx] / quantization_matrix[idx] as f64).round();
        *item = *item * quantization_matrix[idx] as f64; // decompress stage begins here, I just don't want to call another for-loop
    }

    Self::multiply_matrix(&mut buf, transposed_dct, &quantization_result);
    intermediate_result = buf.clone();
    Self::multiply_matrix(&mut buf, &intermediate_result, dct);

    let mut output = vec![0_u8; 64];
    //let mut tmp;
    for (idx, item) in output.iter_mut().enumerate() {
        *item = (buf[idx] + 128 as f64).round() as u8 // it's possible that 255.6 would get rounded to 256, then wrapped to 0 due to 'as u8' downcast.
    }

    let s = format!("{:?}", output);
    s

    // create a new_pixels vector with the width/height being multiple of 8
    // run split_mut_at on this vector to generate an iterator of mutable ref to each row, mut_at() is
    // passed a closure which split at row end
    // while iterating over each mutable row ref, call copy_from_slice() to copy the data from old pixel vec
    }


    // quality is between 10 ~ 100. When img is loaded, its quality is 100, thus,
    // passing 100 would reload the img, without bothering going through all the compression steps
    pub fn quantization_matrix(quality: i32) -> Vec<u8> {
        let quality_50: Vec<u8> = vec![
            16, 11, 10, 16, 24,  40,  51,  61,
            12, 12, 14, 19, 26,  58,  60,  55,
            14, 13, 16, 24, 40,  57,  69,  56,
            14, 17, 22, 29, 51,  87,  80,  62,
            18, 22, 37, 56, 68,  109, 103, 77,
            24, 35, 55, 64, 81,  104, 113, 92,
            49, 64, 78, 87, 103, 121, 120, 101,
            72, 92, 95, 98, 112, 100, 103, 99
        ];
        let mut v = 0.0;
        match quality {
            q if q > 50 =>
                quality_50.iter().map(|item| {
                    ((*item as i32 * (100 - q)) as f64/50 as f64).round() as u8 // they are definitely inside [0, 255]
                }).collect(),
            q if q < 50 =>
                quality_50.iter().map(|item| {
                    v = (*item as f64 * (50 as f64/q as f64)).round();
                    if v > 255.0 { 255 as u8 } else { v as u8 } // 255.5 rounded to 256, which get wrapped around to 0 if 'as u8' is directly applied
                } ).collect(),
            _ => quality_50,
        }
    }
}
