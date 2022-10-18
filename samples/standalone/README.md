# RYSKUrl stamdalone sample project
This is a usage example of a standalone RYSK library.
The library is packed in the files MantisRYSK.min.js, MantisRYSKPlayCanvas.min.js and MantisRYSKaframe.min.js. 
These can be obtained from the npm package ``@mantisvision/rysk``, ``@mantisvision/ryskplaycanvas`` 
and ``@mantisvision/ryskaframe`` respectively.
However, it doesn't need to be installed using a package manager since this example intentionaly doesn't use either
yarn or npm to demonstrate a simple HTML inclusion of the library.

The code of the example is in ``three.js``, ``playcanvas.js`` abd ``aframe.js``.

### Note:
If Three.js in some later versions doesn't register global variable by itself, it must be created manually in ``app.js``
e.g. like this:
```javascript
import * as three from "https://unpkg.com/three@0.145.0";

window.THREE = three;
```
