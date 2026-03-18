# RYSKThreejs
This an integration of ``@mantisvision/rysk*`` libraries with three.js in order to produce a self-updating 3D mesh
usable in a three.js scene. ``@mantisvision/ryskthreejs`` depends on both ``@mantisvision/ryskstream`` and ``@mantisvision/ryskurl``, as well as on
external three.js library.

## Install
You can install this package using your favorite package manager; for example yarn or npm:
```shell
yarn add @mantisvision/ryskthreejs
npm install @mantisvision/ryskthreejs
```

## Usage:
You can use this library in the following way:
```javascript
import { URLMesh, StreamMesh } from "@mantisvision/rysk";

const ryskUrl = new URLMesh({ 
	mediaurl: "video_url",
	dataurl: "data_url"
});
const ryskStream = new StreamMesh({ mediastream: MediaStream });
```
## Public API:
Exported class ``URLMesh`` extends class ``RYSKUrl`` from ``@mantisvision/ryskurl`` and exported class ``StreamMesh``
extends class ``RYSKStream`` from ``@mantisvision/ryskstream``. You can find the description of their API [here](./ryskurlryskstream.md).

### API differences
The configuration objects objects passed to the constructors may contain an additional property `textureColorSpace` which sets the color space of the underlying video texture. Default value is whatever the current three.js version uses as its default.

```javascript
import { URLMesh, StreamMesh } from "@mantisvision/rysk";
import * as THREE from "three";

// the third parameter is the initial size of the buffer and the fourth is the colorspace
const ryskUrl = new URLMesh({
	mediaurl: "video_url",
	dataurl: "data_url",
	textureColorSpace: THREE.SRGBColorSpace
});

//the second parameter is the color space
const ryskStream = new StreamMesh({ 
	mediastream: MediaStream,
	textureColorSpace: THREE.SRGBColorSpace
});
```

The `init` method resolves with the object containing the same properties as in the case of the parent classes, however there's additional property called `mesh` which contains three.js s mesh object that can be used in the scene. Object's texture and geometry gets automatically updated; there is therefore no need to listen on ``dataDecoded`` event from parent classes. 

There is one new method ``getMesh()`` which works similarly to ``getCanvas()``, but returns three.js mesh instead
(remember that both these methods work only after `init()` method is called for the first time, otherwise they return 
null).

Same as with the parent classes, you can use `autoinit` property in the configuration object which is passed to the constructor. The callback which is assigned to its `onSuccess` property will be called with the same object parameter as in the parent class, but the object will also contain the `mesh` property as is the case with the `init` method.

WARNING! If you use the `init` method, even though it's marked as async, you shouldn't structure your code in a way you "await" till the promise returned from `init` resolves, and only then call `play`!. In order to resolve with a mesh, `init` method requires you to also call ``play`` (before or after) because the mesh can only be constructed after at least one frame from the video is played.

The previous restriction can be bypassed by setting the preview mode via ``setPreviewMode(true)`` method. The method is inherited from ``RYSKUrl``, but here it's effect is even more prominent as it also allows to obtain the three.js mesh from the `init` method prior to calling the ``play()``. Furthermore, the method is expanded by allowing to pass not only ``true`` or ``false``, but also values from the ``PreviewMode`` enum; namely:
- ``PreviewMode.disabled`` - same as passing ``false``
- ``PreviewMode.full`` - same as passing ``true``
- ``PreviewMode.partial`` - the new mode which at the beginning shows only gray, untextured mesh (i.e. doesn't internally call ``play()`` on the video texture). This can save some bandwidth and is in theory less prone to provoke a negative reaction from the browser due to autoplay restrictions. It is worth noting that the behavior when calling the ``jumpAt()`` method remains the same with the ``partial`` and the ``full`` modes (so the mesh is once again fully textured and not just gray).  
The preview mode can be also set in the constructor's configuration object via the `previewMode` property.

## Examples
This is an example of how to use ``URLMesh``:

```javascript
import { URLMesh } from "@mantisvision/ryskthreejs";
import * as THREE from "three";

const ryskObj = new URLMesh({
	mediaurl: "video_url",
	dataurl: "data_url",
	textureColorSpace: THREE.SRGBColorSpace,
	autoinit: {
		onSuccess(result)
		{
			const mesh = result.mesh;
			/* do something with the three.js mesh */
		},
		onError: console.error
	}
});

ryskObj.on(RyskEvents.videoEnded,() => 
{ 
	ryskObj.dispose();
	/* free the resources, clean up */ 
});

ryskObj.play();
```

This is an example of how to use ``StreamMesh``:

```javascript
import { StreamMesh } from "@mantisvision/ryskthreejs";
import * as THREE from "three";

// StreamMesh run method requires videoWidth and videoHeight of the stream. Be mindful that this should be
// the size of the original video! Should you provide the video size after scaling it up/down (for example due 
// to webRTC scaling it up/down to fit the network bandwidth), the library will have trouble to read the correct
// frame number from it!
const ryskObj = new StreamMesh({
	mediastream: MediaStream,
	textureColorSpace: THREE.SRGBColorSpace
	autoinit: {
		videoWidth: videoWidth,
		videoHeight: videoHeight,
		onSuccess(result)
		{
			const mesh = result.mesh;
			/* do something with the three.js mesh */
		},
		onError: console.error
	}
});

ryskObj.play(); 
```
## Release notes

### 0.8.0
Source codes were migrated to Typescript. The build of the library still produces javascript files for backwards
compatibility, but ``*.d.ts`` files with type declarations are included in ``dist/src`` folder for typechecking.

### 0.9.1
``URLMesh`` and ``StreamMesh`` constructors get additional parameter which can be used to set the color space of the texture.
Default value is whatever the current three.js version uses as default (currently r153 uses THREE.NoColorSpace).

### 0.10.0
Closely connected to the 3.1.0 release of ``@mantisvision/ryskurl``. A new method ``setPreviewMode(mode: boolean|PreviewMode)`` is added to the ``URLMesh`` class. In addition to the same named method from ``RYSKUrl`` which it overrides, this one allows to set the preview to the partial mode (value 2) which shows an untextured mesh when the RYSK object into the scene (in theory, it should save some bandwidth).

#### 0.10.1
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability. For the same reason webpack configuration now emits dist files with ESM exports and imports.

### 0.11.0
Connects to [3.2.0](./ryskurlryskstream.md#320) release of ``@mantisvision/ryskurl``.

### 0.12.0
Connects to [3.2.0](./ryskurlryskstream.md#320) release of ``@mantisvision/ryskurl``.

### 0.13.0
Switch to three.js r158

### 0.15.0
Added caching of .syk files into IndexedDB where available (``@mantisvision/ryskdownloader`` version [0.8.0](./downloader.md#080)). The caching is made to persist only a single session in the browser.

### 1.1.0
Better code organization which relates to [@mantisvision/splatthreejs](./splatthreejs.md) package.

### 1.2.0
Bumped version because [@mantisvision/utils](./utils.md) and [@mantisvision/ryskbuffer](./buffer.md) removed `update()` method.  
`run()` method is now deprecated and you should use `init()` method instead

#### 1.2.1
Three.js dependency updated to 0.183.
