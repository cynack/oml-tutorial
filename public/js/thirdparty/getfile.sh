#!/bin/sh
npm install
cp node_modules/three/build/three.min.js ./
cp node_modules/three/examples/js/controls/VRControls.js ./
cp node_modules/three/examples/js/effects/VREffect.js ./
cp node_modules/webvr-polyfill/build/webvr-polyfill.min.js ./
cp node_modules/webvr-polyfill/build/webvr-polyfill.min.js.map ./
cp node_modules/webvr-ui/build/webvr-ui.min.js ./
rm -rf node_modules