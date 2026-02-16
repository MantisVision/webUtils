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

## Release notes

### 3.0.0
Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards
compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.

#### 3.0.1
Includes changes from [@mantisvison/ryskurl 3.0.1](./ryskurlryskstream.md#301) and [@mantisvison/ryskdownloader 0.5.1](./downloader.md#051)

### 3.2.0
Includes changes from [@mantisvison/ryskurl 3.1.0](./ryskurlryskstream.md#310)

### 4.0.0
*Breaking Change!* in the npm (not standalone!) version. 
- the package has no longer a default export which exports an object carrying multiple properties with classes, but instead uses classic named exports.
- three.js is now a peer dependency, i.e. the consumers of the library must have three.js listed among their core dependencies.
- the ``type`` field in ``package.json`` has now value ``module``.

### 4.1.0
Connects to [3.2.0](./ryskurlryskstream.md#320) release of ``@mantisvision/ryskurl``.

### 4.2.0
Connects to [3.3.0](./ryskurlryskstream.md#330) release of ``@mantisvision/ryskurl``.
#### 4.2.4
Important bugfix from [0.6.2](./buffer.md#062) release of ``@mantisvision/ryskbuffer``.
#### 4.2.9
Important bugfix from [0.6.5](./buffer.md#065) release of ``@mantisvision/ryskbuffer``.
#### 4.2.10
Switch to three.js r158
### 4.3.0
``@mantisvision/ryskdownloader`` version [0.7.0](./downloader.md#070) is incorporated.
### 4.4.0
Added caching of .syk files into IndexedDB where available (``@mantisvision/ryskdownloader`` version [0.8.0](./downloader.md#080)). The caching is made to persist only a single session in the browser.
### 4.6.0
Better code organization which relates to [@mantisvision/splatthreejs](./splatthreejs.md) package.
#### 4.6.1
Bumped version because [@mantisvision/utils](./utils.md) and [@mantisvision/ryskbuffer](./buffer.md) removed `update()` method.
### 4.7.0
Extended `init()` method in `URLMesh` and `StreamMesh` and added `autoinit` property to configuration object in the constructors. This is now preferred way to initialize objects.
