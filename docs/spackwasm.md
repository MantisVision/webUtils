# spackwasm
This package contains wasm code of the decoder of SPACK and SPLINETR files, together with the necessary javascript loader. 
It exports a single asynchronous function that returns Wasm module upon which a decoding methods can be called.

## Install
You can install this package using your favorite package manager; for example yarn or npm:
```shell
yarn add @mantisvision/spackwasm
npm install @mantisvision/spackwasm
```

## Usage:

For SPACK: 
```javascript
import { GetWasmSPACKModule } from "@mantisvision/spackwasm";

GetWasmSPACKModule().then(Module =>
{
	const wasmInstance = new Module.SPACKInterface();
	// Use version of SPACK
	wasmInstance.CreateDecoderSPACK("0");
	
	let inputArr = this.wasmInstance.GetInput(frame.length);
	inputArr.set(frame); // frame = encoded byte data of the frame
	const decoded = wasmInstance.Decode();
	
	// ... do something with the decoded data
});
```
Decoded SPACK data has the following format:
```typescript
interface SpackRenderData {
	isIframe:number;
	frameNumber:number;
	numberSplats:number;
	mmConvert:number;
	patchBorder:number;
	frameTexWidth:number;
	frameTexHeight:number;
	patchWidth:number;
	patchHeight:number;
	shOrder:number;

	features:number;
	lastKeyframeNo:number;

	GP_BBBR:Vector3f;
	GP_BBTL:Vector3f;
	
	baseBufferPointer:bigint;
	allocatedByteSize:number;
	
	dynamicRange:bigint;
	outOfBounds:bigint;
	globalPositions:bigint;
	colorPalette:bigint;
	colorPaletteIndex:bigint;
	patchInfoTable:bigint;
	hCurve2d:bigint;
	clusterPosition:bigint;
	reindexing:bigint;

	dynamicRangeSize:number;
	outOfBoundsSize:number;
	globalPositionsSize:number;
	colorPaletteSize:number;
	colorPaletteIndexSize:number;
	patchInfoTableSize:number;
	hCurve2dSize:number;
	clusterPositionsSize:number;
	reindexingSize:number;

	indexingTexWidth:number;
	indexingTexHeight:number;
	paletteIndexTexWidth:number;
	paletteIndexTexHeight:number;
	gpTexWidth:number;
	gpTexHeight:number;

	indexingPositionTex:bigint;
	indexingPositionTexWidth:number;
	indexingPositionTexHeight:number;
}

interface Vector3f {
	x:number;
	y:number;
	z:number;
}
```
If you wish to decode SPLINTER data, you can do it like this:
```javascript
import { GetWasmSPLINTERModule } from "@mantisvision/spackwasm";

GetWasmSPLINTERModule().then(Module =>
{
	const wasmInstance = new Module.SPLINTERInterface();
	// Use version of SPLINTER
	wasmInstance.CreateDecoderSplinter("0");
	
	let inputArr = this.wasmInstance.GetInput(frame.length);
	inputArr.set(frame); // frame = encoded byte data of the frame
	const decoded = wasmInstance.Decode();
	
	// ... do something with the decoded data
});
```
Decoded SPLINTER data has the following format:
```typescript
interface SplinterRenderData {
	isIframe:number;
	reserved:number;
	numberSplats:number;
	shOrder:number;

	textureWidth:number;
	textureHeight:number;

	tanhTransferScale:number;

	BBBR:Vector3f;
	BBTL:Vector3f;
	scaleMax:Vector3f;

	baseBufferPointer:bigint;
	allocatedByteSize:number;

	textureData:bigint;
	globalPositions:bigint;

	textureDataSize:number;
	globalPositionsSize:number;
}

interface Vector3f {
	x:number;
	y:number;
	z:number;
}
```
## Release notes

### 0.4.0
Typescript type annotations were added into ``dist/MantisRYSKWASM.d.ts``.

#### 0.4.2
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability.

#### 0.4.3
WASM file recompiled with Draco v 1.5.7 and emsdk 3.1.53

#### 0.5.0
Added an ability to decode SPLAT and SPLINTER.
