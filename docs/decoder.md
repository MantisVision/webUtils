# RYSKDecoder
This package exports class which loads WASM from @mantisvision/ryskwasm and uses it to decode data of one frame into arrays of uvs, vertices and indices.

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskdecoder
npm install @mantisvision/ryskdecoder
```

## Usage:
```javascript
import RYSKDecoder from "@mantisvision/ryskdecoder";

const decoder = new RYSKDecoder("RYS0");
decoder.init().then(() => 
{
	const decodedData = decoder.decode(encodedData);
	const { uvs, indices, vertices } = decodedData;
});
```

## Public API
```javascript
/**
 * Creates an instance of the SYK/RYSK decoder of the given type.
 * @param {String} type must be one of these: SYK0, SYK1, RYS0
 */
constructor(type);
```
```javascript
/**
 * Inits decoder. This method loads WASM a readies it for the decoding.
 * @returns {unresolved}
 */
async init();
```
```javascript	
/**
 * Decodes the given frame.
 * @param {Array} frame byte data of the frame
 * @param {Boolean} returnReference if set to true, the return value will be a direct reference to the memory of wasm -- 
 *			this is very fast for a single reading, but the memmory can overwritten by further calls of this method. 
 *			If set to false (default and recommended if you're unsure), a safe copy will be made and returned. 
 *			The cpúe can be freely modified or sent to/from the webworker.
 * @returns {Object} object containing three parameter: vertices, uvs, indices; each of them is a Typed array, they might share the same buffer, but have different offsets!
 */
decode(frame,returnReference = false);
```
```javascript	
/**
 * It is highly recommended to call this method after all the data has been decoded.
 */
dispose();
```
