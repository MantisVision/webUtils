# SplatThreejs
This library serves to sort splats from the decoded SPACK/SPLINTER format, pair it with either the videoframe drawn on the canvas or an audio timestamp, and then construct an animated 3D mesh usable in [Three.js](https://threejs.org) library.

## Install
You can install this package using your favorite package manager; for example yarn or npm:
```shell
yarn add @mantisvision/splatthreejs
npm install @mantisvision/splatthreejs
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
Even though the construction of the `SplatMesh` is looks similar to e.g. `URLMesh` from `@mantisvision/ryskthreejs` library, the difference is that `SplatMesh` itself is a Three.js mesh object and can be directly inserted into the scene. If you want to get the equivalent of the `URLMesh`, you need to either wait to resolve the `init()` call or use the parameter passed to the `onSuccess` property of `autoinit` in the constructor's configuration object. Another option is to call `getSplatUrl()` method, but that one returns the object after init is resolved.

```javascript
mesh.init().then(splatUrl => { /* use the object e.g. to insert it into the  */ });
...

const splatUrl = mesh.getSplatUrl();
```
The configuration object of the constructor must be of the following type:
```typescript
{
	/** url of the media to be downloaded */
	mediaurl: string;
	/** dataurl url of the volumetric data (SYK/RYSK/SPLINTER/SPACK) */
	dataurl: string; 
	/** how many frames of SYK/RYSK data should be preloaded */
	frameBufferSize?: number; 
	/** how many bytes must be downloaded until playback is even started */
	minimalRequiredDownloaded?: number;
	/** whether the volumetric video should loop (true by default) */
	loop?: boolean;
	/** enable/disable the preview mode (default is false) */
	previewMode?: boolean;
	/** timestamp of the playback start in the media */
	beginning?: number;
	/** timestamp of the playback end in the media */
	end?: number;
	/** reference to Three.js renderer */
	renderer?: THREE.WebGLRenderer;
	/** colorspace of the texture */
	textureColorSpace?: THREE.ColorSpace;
	/** more granular configuration of the mesh */
	options?: {
		splatRenderMode: number;
		dynamicMode: boolean;
		enableOptionalEffects: boolean;
		halfPrecisionCovariancesOnGPU: boolean;
		devicePixelRatio: number;
		antialiased: boolean;
		maxScreenSpaceSplatSize: number;
		logLevel: number;
		sphericalHarmonicsDegree: number;
		sceneFadeInRateMultiplier: number;
		kernel2DSize: number;
		focalAdjustment: number;
		sceneRevealMode: number;
		gpuAcceleratedSort:boolean;
		integerBasedSort:boolean;
		sharedMemoryForWorkers:boolean;
		enableSIMDInSort:boolean;
		splatSortDistanceMapPrecision?:number;
	}
	/** 
	 * If the callback is provided to autoinit, the object shall be initialized 
	 * straight in the constructor and the SplatUrl (i.e. either SPLINTERUrl or SPACKUrl) will be passed to the callback
	 * once it's ready (usually after calling play() or if the previewMode is set to true).
	 */
	autoinit?: {
		onSuccess: (splatURL: SplatUrl) => void;
		onError: (error: unknown) => void;
	};
}
```
The class and the library itself is able to process both SPACK and SPLINTER decoded data. However, it's important to remember that SPACK data creates a texture from the passed MP4 video, while SPLINTER data doesn't need any other visual part, only AAC encoded audio which is used for synchronization and a proper playback.

## Public API:
Exported class ``SplatMesh`` extends class `Object3D` from Three.js library. At the same time, it proxies many calls to the underlying `SPLINTERUrl` and `SPACKUrl` classes. They both extend `AbstractRYSKUrl` class from the `@mantisvision/ryskurl` library and provide same methods as [RYSKUrl class](./ryskurlryskstream.md#ryskurl-1).

One important method which a user needs to call on `SplatMesh` each animation frame is `update()` with a Three.js camera passed as the only parameter. That's because the splats in the `SplatMesh` must be updated each time camera changes its position.

## Examples
This is an example of how to use ``URLMesh``:

```javascript
import * as THREE from "three";
import { SplatMesh } from "@mantisvision/splatthreejs";

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, precision: 'highp'});
renderer.setPixelRatio(window.devicePixelRatio);
	
renderer.setSize(1920, 1080);
renderer.setClearColor(0x696969);
renderer.autoClear = true;

const camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.01, 100);
camera.position.set(2, 1, 0);
camera.lookAt(0, 0.8, 0);

scene.add(camera);

document.body.appendChild(renderer.domElement);
const splatMesh = new SplatMesh({
	renderer: renderer,
	mediaurl: "media_url",
	dataurl: "data_url",
	loop: true,
	autoinit: {
		onError: console.error,
		onSuccess()
		{
			splatMesh.setVolume(1);
			scene.add(splatMesh);
		}
	}
});

renderer.setAnimationLoop((timestamp, frame) => 
{		
	splatMesh.update(camera);
	
	if (splatMesh.canRender()) 
	{	
		renderer.render(scene, camera);
		//updateFPS();
	}
});
```
