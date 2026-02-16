# RYSKDecoder
This package exports various javascript decoders of compressed volumetric data; not only RYSK, but alos SPACK and SPLINTER. Based on the imported decoder, `@mantisvision/ryskwasm` or `@mantisvision/spackwasm` library is used to actually decode the data.

## Install
You can install this package using your favorite package manager; for example yarn or npm:
```shell
yarn add @mantisvision/ryskdecoder
npm install @mantisvision/ryskdecoder
```

## Usage:
```javascript
import { RYSKDecoder, SPACKDecoder, SPLINTERDecoder } from "@mantisvision/ryskdecoder";

const decoderRYSK = new RYSKDecoder("RYS0");
decoderRYSK.init().then(() => 
{
	const decodedData = decoderRYSK.decode(encodedRYSKData);
	const { uvs, indices, vertices } = decodedData;
});

const decoderSPACK = new SPACKDecoder("SPK1");
decoderSPACK.init().then(() => 
{
	const decodedData = decoderSPACK.decode(encodedSPACKData);
});

const decoderSPLINTER = new SPLINTERDecoder("SPL1", 25, 8);
decoderSPLINTER.init().then(() => 
{
	const decodedData = decoderSPLINTER.decode(encodedSPLINTERData);
});
```

While the RYSKDecoder simply produces three typed arrays representing vertices, indices and uvs, SPACK and SPLINTER volumetric data are gaussians in nature and the result of decode call is different. In case of the SPACK, the return type is the following:
```typescript
type SPACKDecodedData = 
{	
  isIFrame: boolean;
  frameNo:number;
  numberSplats:number;             
  mmConvert:number;
  patchBorder:number;
  frameTexWidth:number;
  frameTexHeight:number;
  patchWidth:number;
  patchHeight:number;
  shOrder:number;

  indexingTex?:Uint32Array;
  globalPosTex?:Float32Array;
  paletteTex?:Float32Array;
  paletteIndexTex?:Uint8Array;
  
  indexingTexWidth:number;
  indexingTexHeight:number;
  paletteTexWidth:number;
  paletteTexHeight:number;
  gpTexWidth:number;
  gpTexHeight:number;
  
  features:number;
  lastKeyframeNo:number;
  
  GP_BBBR:number[];
  GP_BBTL:number[];
  
  patchInfoTable:number[][];
}
```
In case of the SPLINTER, the return type is:
```typescript
type SplinterDecodedData =
{
  isIFrame:boolean;
  reserved:number;
  numberSplats:number;
  shOrder:number;

  textureWidth:number;
  textureHeight:number;
  
  tanhTransferScale:number;

  BBBR:number[];
  BBTL:number[];
  scaleMax:number[];

  textureData?:Uint8Array;
  globalPositions?:Float32Array;
}
```

## Public API
The easiest way to create a new decoder is to use the factory function `CreateDecoder`:

```typescript
/**
 * Creates a suitable decoder based on the given parameters
 * @param type type of the decoder. Currently supported are: SYK0, SYK1, RYS0, RYS1, RYS2, SPK1, SPL1
 * @param arg[] other arguments useful for different decoders; currently fps and numSH are supported for splinter decoder
 */
function CreateDecoder(type: string, ...arg: unknown[]);
```

All three decoders implement the same interface `IDecoder<DecodedData>` where `DecodedType` is type of the data the decoder returns.

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
 *			this is very fast for a single reading, but the memory can overwritten by further calls of this method. 
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

#### 0.3.2
A slightly optimized inner loading of the WASM module.

#### 0.3.6
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability. For the same reason webpack configuration now emits dist files with ESM exports and imports.

### 0.5.0
Added SPACK and SPLINTER decoders.

### 0.6.0
Added a factory function for creating a decoder based on the passed "type" parameter
