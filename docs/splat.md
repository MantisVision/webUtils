# Splat
This is an equivalent of `@mantisvision/rysk` package. It combines all the dependencies of `@mantisvision/splatthreejs` into one standalone file which can be included/imported directly in the HTML without a need to have a bundler. It also provides a npm variant with inlined workers and wasm scripts in case you use bundlers which have issues with creating separate workers and wasm during bundling.

## Install
You can install this package using your favorite package manager; for example yarn or npm:
```shell
yarn add @mantisvision/splat
npm install @mantisvision/splat
```

## Usage:
You can use this library in the following way:
```javascript
import { SplatMesh } from "@mantisvision/splatthreejs";
import * as THREE from "three";

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
	
renderer.setSize(width,height);
renderer.setClearColor(0xFFFFFF, 1);
renderer.autoClear = false;

const mesh = new SplatMesh({
	renderer: renderer,
	mediaurl: "mediaurl",
	dataurl: "dataurl",
	autoinit: {
		onSuccess(splatUrl)
		{
			mesh.setVolume(1);
			//add the mesh to the scene you've created somewhere
			scene.add(mesh);
		},
		onError: console.error
	}
});
...
scene.remove(mesh);
mesh.dispose();
```

Alternatively, you can directly use a standalone minified ``MantisRYSK.min.js`` file which is bundled together with the standard npm package.
Suppose you store your npm packages in node_modules directory, you can find the file in ``node_modules/@mantisvision/rysk/dist/MantisRYSK.min.js``
This file expects global THREE variable from three.js library. Therefore, you have to load three.js library prior to MantisRYSK.min.js either through a script tag:
```html
<script type="text/javascript" src="./three.min.js"></script>
<script type="text/javascript" src="./MantisSplat.min.js"></script>
```
or you can import it as a module in your main javascript. Three.js during import automatically creates a necessary global THREE variable:
```javascript
import * as threeModule from "https://unpkg.com/three@0.180.0";

if ("THREE" in window)
{//confirm there is a global variable named THREE
	import("./MantisSplat.min.js").then(() => 
		{
			//your code
		});
}else throw "Missing global THREE variable";
```
Tested version of three.js compatible with ``@mantisvision/splat`` is r180. If you use a different version, there might be issues due to frequent changes in three.js API.

``MantisSplat.min.js`` creates its own, global variable and names it Splat. It contains the following properties (=exports):
- SplatMesh
- SPLINTERUrl
- SPACKUrl
- SplatBuffer
- SpackLoader
- OrbitControls

They can be used in a similar way as in the case of the node package:
```javascript
import("./MantisRYSK.min.js").then(() => 
	{
		const ryskUrl = new Rysk.URLMesh({
			mediaurl: "video_url",
			dataurl: "data_url",
			autoinit: {
				onSuccess(elements)
				{
					const { canvas, video } = elements;
					ryskUrl.setVolume(1);
					/* do something with the canvas */ 
				},
				onError: console.error
			}
		});
		const ryskStream = new Rysk.StreamMesh({
			mediastream: MediaStream,
			autoinit: {
				videoWidth: 1920,
				videoHeight: 1080,
				onSuccess(elements)
				{
					const { canvas, video } = elements;
					ryskObj.setVolume(1);
					/* do something with the canvas */ 
				},
				onError: console.error
			}
		});
	});
```

## Public API:
Description of API can be found [here](./splatthreejs.md);
