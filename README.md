# Introduction
This app is the result of my learning experience of Rust, WebAssembly and image processing
(I have deployed it on my personal server, [go check it out (https://ewo.xyz/image-editor)](https://ewo.xyz/image-editor)), 
but I am planning to make it a long-term project, and finally, turn it into a full-featured app.
With the release of draft spec in 2017, WebAssembly seems to be a good fit for the technical requirement of this kind of app.

There are still many known bugs, and rooms for improvements. For example, "Filter -> Smoothen" is implemented with naive "Bilateral Filter", 
which is way too slow(takes more than 10 seconds for a medium-size image). 
Some operations can be performed in JavaScript in a more efficient way,
but for the sake of learning, I still implement them in Rust.

# Installation
## Prerequisites
Upgrade npm, install Rust and wasm-pack(a one-stop shop for building and working with Rust-generated WebAssembly that you would like to interop with JavaScript).

```bash
npm install npm@latest -g
curl https://sh.rustup.rs -sSf | sh
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

## Install
```bash
git clone https://github.com/edwardwohaijun/image-editor
cd image-editor
wasm-pack build
cd www
npm install
cd ../pkg
npm link
cd ../www
npm link image-editor
npm run start
```
open Chrome and go to `http://localhost:8080/image-editor`

note: 
* if you want to run this app with a dedicated HTTP server, like Apache. 
You need to add the following MIME-type in `/etc/mime.types`. 
For Nginx, you need to add this in `/etc/nginx/mime.type` as well. 
Then restart HTTP server.
```
application/wasm         wasm
```

* Images can be captured from your camera, which requires HTTPS for non-localhost server(self-signed TLS certificate is OK).

# Feature
## Transform
* Crop
* Rotate(±90deg only)
* Scale(Linear interpolation)

## Color
* Black & White
* Invert
* HSI adjust
* Contrast & Brightness adjust

## Filter
* Pixelate(Mosaic or Blur)
* Blur(Gaussian blur)
* Miniaturize
* Smoothen(Bilateral filter under the hood)

Here is the image before/after applying the smoothing effect:
![smoothed Eddie Redmayne](https://raw.githubusercontent.com/edwardwohaijun/image-editor/master/smoothing_effect.jpg)

There are two parameters controlling the smoothing result, when they both approach max value, it'll create a cartoonish feel, like this:
![cartoonish Gal Gadot](https://raw.githubusercontent.com/edwardwohaijun/image-editor/master/cartoonish_effect.jpg)

Note: the implementation of Bilateral Filter algorithm behind this effect is very low efficient,
the more smooth and bigger the image, the longer time it'd take, for cartoonish effect, it might take 2 MINUTES to finish.


## License

This project is licensed under [MIT](https://github.com/edwardwohaijun/image-editor/blob/master/LICENSE)
