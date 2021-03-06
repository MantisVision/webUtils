# ryskwasm
This package contains wasm code of the decoder, together with the necessary javascript loader. 
It exports a single asynchronous function that returns Wasm module upon which a decoding methods can be called.

## Install
You can install this package using either of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskwasm
npm install @mantisvision/ryskwasm
```

## Usage:
```javascript
import GetWasmModule from "@mantisvision/ryskwasm";

GetWasmModule().then(Module =>
{
	const wasmInstance = new Module.SYKInterface();
	wasmInstance.CreateDecoderRYSK("0");
	
	let inputArr = this.wasmInstance.GetInput(frame.length);
	inputArr.set(frame); // frame = encoded byte data of the frame
	wasmInstance.Decode();
	
	// these three are typed arrays of vertices, uvs and indices
    // their ArrayBuffer belongs to WASM, so it is prudent to copy them first because their data might get overriden 
    // by the next decoding process
	const vertices = wasmInstance.GetVertices();
	const uvs = wasmInstance.GetUVs();
	const indices = wasmInstance.GetIndices();

	// ... do something with vertices, uvs and indices
};						
```


