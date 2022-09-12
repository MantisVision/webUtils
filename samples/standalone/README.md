This is a usage example of a standalone RYSK library.
The library is packed in the file MantisRYSK.min.js. This can be obtained from the npm package ``@mantisvision/rysk``.
However, it doesn't need to be installed using a package manager since this example intentionaly doesn't use either
yarn or npm to demonstrate a simple HTML inclusion of the library.

The code of the example is in ``app.js``. At the beginning of the file, a three.js library is imported as that one
isn't included in the RYSK library. This import creates a global ``THREE`` variable which the RYSK library expects to exist,
therefor the import must take place prior to the importing of RYSK.

If in some later versions three.js does not register global variable by itself, it must created manually e.g. like this:
```javascript
import * as three from "https://unpkg.com/three@0.141.0";

window.THREE = three;
```

Do not forget to set the ``visible`` property of the mesh to ``true`` after it is obtained from the resolved run method,
otherwise the mesh won't be visible.
