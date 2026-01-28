# Standalone sample project
This is a usage example of a standalone RYSK/Splat libraries.
The RYSK library is packed in the files ``MantisRYSK.min.js``, ``MantisRYSKPlayCanvas.min.js`` and ``MantisRYSKaframe.min.js``. The Splat library is in the file ``MantisSplat.min.js``
These can be obtained from the npm packages ``@mantisvision/rysk``, ``@mantisvision/ryskplaycanvas``, ``@mantisvision/ryskaframe`` and ``@mantisvision/splat`` respectively.
However, it doesn't need to be installed using a package manager since this example intentionally doesn't use either
yarn or npm to demonstrate a simple HTML inclusion of the library.

The code of the examples is in ``three.js``, ``playcanvas.js``, ``aframe.js`` and ``splat.js``.

There's also an example of the use of a standalone ``@mantisvision/synchronizer`` which can be found in ``synchronized.js`` file.

### Note:
If Three.js in some later versions doesn't register global variable by itself, it must be created manually in the script
e.g. like this:
```javascript
import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.180.0/three.module.js";

window.THREE = THREE;
```
