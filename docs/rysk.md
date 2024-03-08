# RYSK
This a combination of @mantisvision/rysk* packages into one bundle. It exposes URLMesh (also aliased as RYSKUrl for backwards 
compatibility) and StreamMesh (aliased also as RYSKStream) objects as properties of the export. 

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/rysk
npm install @mantisvision/rysk
```

## Usage:
You can use this library in the following way:
```javascript
import { URLMesh, StreamMesh } from "@mantisvision/rysk";

const ryskUrl = new URLMesh("video_url","data_url");
const ryskStream = new StreamMesh(MediaStream);
```

Alternatively, you can directly use a standalone minified ``MantisRYSK.min.js`` file which is bundled together with the standard npm package.
Suppose you store your npm packages in node_modules directory, you can find the file in ``node_modules/@mantisvision/rysk/dist/MantisRYSK.min.js``
This file expects global THREE variable from three.js library. Therefore, you have to load three.js library prior to MantisRYSK.min.js either through a script tag:
```html
<script type="text/javascript" src="./three.min.js"></script>
<script type="text/javascript" src="./MantisRYSK.min.js"></script>
```
or you can import it as a module in your main javascript. Three.js during import automatically creates a necessary global THREE variable:
```javascript
import * as threeModule from "https://unpkg.com/three@0.138.0";

if ("THREE" in window)
{//confirm there is a global variable named THREE
	import("./MantisRYSK.min.js").then(() => 
		{
			//your code
		});
}else throw "Missing global THREE variable";
```
Tested version of three.js compatible with ``@mantisvision/rysk`` is r138. If you use a different version, there might be issues due to frequent changes in three.js API.

``MantisRYSK.min.js`` creates its own, global variable and names it Rysk. It contains 4 properties:
- URLMesh
- StreamMesh
- RYSKUrl (alias of URLMesh)
- RYSKStream (alias of StreamMesh)

They can be used in a similar way as in the case of the node package:
```javascript
import("./MantisRYSK.min.js").then(() => 
	{
		const ryskUrl = new Rysk.URLMesh("video_url","data_url");
		const ryskStream = new Rysk.StreamMesh(MediaStream);
	});
```

## Public API:
Description of API can be found [here](./threejs.md);

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
