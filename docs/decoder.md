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
 * This method is used to avoid an unnecessary copying of data between the downloader and the WASM.
 * @param {Integer} length length of the array which will be filled with the input data
 * @returns {Uint8Array} Typed array of the requested length
 */
getMemoryForInput(length);
```
```javascript	
/**
 * Decodes the given frame.
 * @param {Array} frame byte data of the frame. This doesn't have to be set if the method getMemoryForInput was used first and the provided input memory was filled with the data.
 * @param {Boolean} returnReference if set to true, the return value will be a direct reference to the memory of wasm -- 
 *			this is very fast for a single reading, but the memmory can overwritten by further calls of this method. 
 *			If set to false (default and recommended if you're unsure), a safe copy will be made and returned. 
 *			The copy can be freely modified or sent to/from the webworker.
 * @returns {Object} object containing three parameter: vertices, uvs, indices; each of them is a Typed array, they might share the same buffer, but have different offsets!
 */
decode(frame = null,returnReference = false);
```
```javascript	
/**
 * It is highly recommended to call this method after all the data has been decoded.
 */
dispose();
```

## Release notes

### 0.3.0
Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards
compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.

