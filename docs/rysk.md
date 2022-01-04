# RYSK
This a combination of @mantisvision/rysk* packages into one bundle. It exposes RYSKUrl and RYSKStream objects as 
properties of the export. 

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/rysk
npm install @mantisvision/rysk
```

## Usage:
You can use this library in the following way:
```javascript
import { RYSKUrl, RYSKStream } from "@mantisvision/rysk";

const ryskUrl = new RYSKUrl("video_url","data_url");
const ryskStream = new RYSKStream(MediaStream);
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
import * as threeModule from "https://unpkg.com/three@0.132.0";

if ("THREE" in window)
{//confirm there is a global variable named THREE
	import("./MantisRYSK.min.js").then(() =>
		{
			//your code
		});
}else throw "Missing global THREE variable";
```
Tested version of three.js compatible with @mantisvision/rysk is r132. If you use a different version, there might be issues due to frequent changes in three.js API.

``MantisRYSK.min.js`` creates its own, global variable and names it Rysk. It conatins two properties:
- RYSKUrl
- RYSKStream

They can be used in a similar way as in the case of the node package:
```javascript
import("./MantisRYSK.min.js").then(() =>
	{
		const ryskUrl = new Rysk.RYSKUrl("video_url","data_url");
		const ryskStream = new Rysk.RYSKStream(MediaStream);
	});
```

## Public API:
Desscription of APIs can be found [here](./rskurlryskstream.md);
