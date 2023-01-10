# Integration guide

The main goal of this library (and specifically ``@mantisvision/ryskurl`` and ``@mantisvision/ryskstream`` packages) is
to decode RYSK/SYK encoded data provided either in the form of URL (ryskurl) or passed through a method call (ryskstream),
while ensuring the result data is delivered to the user of the library in sync with the provided pre-recorded video (ryskurl)
or the realtime mediastream (ryskstream).

How the data (namely framenumber, uvs, vertices and indices) should be used further down the road is up to the developers
who integrate the library to their system. ``@mantisvision/ryskthreejs`` and ``@mantisvision/ryskplaycanvas`` are two
such reference implementations which use the provided data (as well as HTML canvas element which is a byproduct of both
ryskurl and ryskstream) to construct the final 3D animated and textured mesh.

This guide aims to present the way in which both mentioned implementations use the core library. It might not be the
universal way or the most optimal for each environment, but the guide might give the integration developers at least
the rough idea of what needs to be done on their end. Furthermore it also poinst some well-known bumps along the way
(particularly regarding iOS Safari behaviour).

For the sake of simplicity, the following guide concerns only with ``@mantisvision/ryskurl``, since that is probably
what the integrators will be mostly interested in. However, ``@mantisvision/ryskstream`` is very similar in essance, save
for the obvious different nature of the inputs (pre-recorded video and data vs dynamic media stream and data), so its
integration would be very, very similar.

## Installing the library packages
Before the work on the proper integration itself begins, it is highly advisable to test the library in its pure form to
verify that the encoded data is being properly decoded, the event callbacks are being triggered, and the video is playing
as it is supposed to.

You can install the package with its dependencies using either Yarn (v1 or berry) or NPM. You have to
specify custom package registry for ``@mantisvision`` packages. For npm, you have to edit either your global or your
project's ``.npmrc`` file and add the following lines:
```
@mantisvision:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=your_git_auth_token_here
```
For Yarn v1, you have to edit ``.yarnrc`` and add the following line:
```
"@mantisvision:registry" "https://npm.pkg.github.com"
```
For Yarn berry, you have to edit ``.yarnrc.yml`` and add the following:
```yaml
npmScopes:
  mantisvision:
    npmRegistryServer: "https://npm.pkg.github.com"
    npmAuthToken: "your_git_auth_token_here"
```
In order to install the packages using NPM, run the following commands:
```
npm i @mantisvision/ryskurl
npm i @mantisvision/utils
```
If you prefer using Yarn, run the following:
```
yarn add @mantisvision/ryskurl
yarn add @mantisvision/utils
```

## First steps
After the packages are installed, use them in your code like this:
```javascript
import RYSKUrl from "@mantisvision/ryskurl";
import { RyskEvents, MantisLog } from "@mantisvision/utils";

// enable debug informations in the console:
MantisLog.SetLogLevel(MantisLog.DEBUG);

// create ryskObj. videoUrl and dataUrl should contain url to videofile and SYK/RYSK datafile.
// the third parameter - 50 - sets the size of the data framebuffer to approximately 50 frames
const ryskObj = new RYSKUrl(videoUrl,dataUrl,50);

// set the video to loop to see if it correctly starts to play once it finishes
ryskObj.loop = true;

ryskObj.on(RyskEvents.dataDecoded, data => 
{// check if the data is being decoded and observe their structure -- 
 // it should contain the frameNumber as well as uvs, indices and vertices in the typed arrays
	console.log(data);
});

// listen for errors as well
ryskObj.on(RyskEvents.error, err => console.error(err));

ryskObj.run().then( htmlElements => 
{// Both these HTML elements are "in memory" only, so you might want to attach them let's say to the body of the webpage
 // in order to observe whether the video is indeed playing. Canvas element gets redrawn each time a new frame in video 
 // is shown AND the previous video frame was paired with the decoded data based on its number. If the data is late,
 // the video is automatically paused and continues only after the data for the frame is actually decoded. This ensures
 // the synchronization between the data and the video.
	const { canvas, video } = elements;

	document.body.appendChild(canvas);
	document.body.appendChild(video);
}).catch(err => console.error(err));

// in order to see something, you need to play the video. Be mindful of strict autoplay policies particularly
// on cellphones -- the user usually needs to interact in some way with your website (e.g. click on a button) and 
// play should run in the callback of said interaction, or the video should be muted (which is true in this case -- see bellow)
ryskObj.play();

// periodically call update() on the rysk object, so it reads the frames from the video and pairs them with the data
const animate = () => 
{
	requestAnimationFrame(animate);
	ryskObj.update();
};
requestAnimationFrame(animate);

```
If everyhing goes well, you should now see various events in the console, as well as the decoded data being delivered. You
should also see the video being played in the browser (twice actually -- for the videoElement and for the canvas as well).

You may notice there is no sound. To turn it on, you need to call this:
```javascript
ryskObj.setVolume(1.0);
```
The huge problem is WHEN to call it. This is due to the restrictions Safari on iOS makes towards autoplay. It should
allow to autostart video when it's muted, but a particularly severe limitation comes with playing two (or more) videos
together. Try to create another RYSKUrl object the same way as the first one, and then try to play them together unmuted
on iOS Safari. You may notice an odd behaviour -- one of the video may not start, or start only muted even if you called
``setVolume(1)``, or it may pause due to buffering of data but not start again once the data is buffered, or it may not
loop etc.

One workaround for this is to mute video each time it pauses (either due to buffering, because user paused it or because
one loop is ending) and unmute it with a certain delay once it resumes to trick Safari into playing it. 
It cannot be told how long this ugly hack will work, but it seems it does for now:

```javascript
import RYSKUrl from "@mantisvision/ryskurl";
import { RyskEvents, MantisLog } from "@mantisvision/utils";

MantisLog.SetLogLevel(MantisLog.DEBUG);

const ryskObj1 = new RYSKUrl(videoUrl1,dataUrl1,50);
const ryskObj2 = new RYSKUrl(videoUrl2,dataUrl2,50);

ryskObj1.loop = true;
ryskObj2.loop = true;

ryskObj1.on(RyskEvents.dataDecoded, console.log);
ryskObj2.on(RyskEvents.dataDecoded, console.log);

ryskObj1.on(RyskEvents.error, console.error);
ryskObj2.on(RyskEvents.error, console.error);

// these variable help to track whether video is buffering
var buffering1 = false;
var buffering2 = false;

ryskObj1.on(RyskEvents.buffering, () => 
{//video is buffering
	buffering1 = true;
	ryskObj1.setVolume(0);
});

ryskObj2.on(RyskEvents.buffering, () => 
{//video is buffering
	buffering2 = true;
	ryskObj2.setVolume(0);
});

ryskObj1.on(RyskEvents.buffered, () => 
{//video is buffered, unmute it after a delay
	buffering1 = false;
	setTimeout(() => 
	{
		if (!buffering1) ryskObj1.setVolume(1.0);
	},400);
});

ryskObj2.on(RyskEvents.buffered, () => 
{//video is buffered, unmute it after a delay
	buffering2 = false;
	setTimeout(() => 
	{
		if (!buffering2) ryskObj2.setVolume(1.0);
	},400);
});

ryskObj1.run().then( htmlElements => 
{
	document.body.appendChild(htmlElements.canvas);
	document.body.appendChild(htmlElements.video);
}).catch(console.error);

ryskObj2.run().then( htmlElements => 
{
	document.body.appendChild(htmlElements.canvas);
	document.body.appendChild(htmlElements.video);
}).catch(console.error);

ryskObj1.play().then(() => 
{// only unmute video once it's playing and only after a certain delay
	setTimeout(() => 
	{
		if (!buffering1) ryskObj1.setVolume(1.0);
	},400);
});

ryskObj2.play().then(() => 
{// only unmute video once it's playing and only after a certain delay
	setTimeout(() => 
	{
		if (!buffering2) ryskObj2.setVolume(1.0);
	},400);
},400);

// periodically update rysk objects so they reads the frames from the video and pair it with the data
const animate = () => 
{
	requestAnimationFrame(animate);
	ryskObj1.update();
	ryskObj2.update();
};
requestAnimationFrame(animate);

```
At the time this guide is being written, only iOS Safari is plagued be these complications, so if your target is desktop
or Android, you may not experience the described issue.

After you are satisfied with the results the library is giving you, you can follow with the integration itself.

## Integration

RYSKUrl object provides decoded data, but you most likely want a full mesh. One way to approach this is to create a new 
class (let's say in ``MeshGenerator.js``) which would inherit from RYSKUrl:

```javascript
import RYSKUrl from "@mantisvision/ryskurl";
import CustomMesh from "./CustomMesh.js";
import { RyskEvents } from "@mantisvision/utils";

export default class MeshGenerator extends RYSKUrl
{
	constructor(videourl,dataurl,framebuffer = 50)
	{
		super(videourl,dataurl,framebuffer);
		this.mesh = new CustomMesh();

		this.on(RyskEvents.dataDecoded,data => 
		{// each time a new set of data is decoded, pass it to the mesh
			const { uvs, indices, vertices } = data;
			this.mesh.update(uvs,indices,vertices);
		});
	}
}
```

``CustomMesh.js`` is a seperate file which exports class with your own mesh which you construct according to your needs
and periodically update.

```javascript
export default class CustomMesh
{
	/**
     * Do some prelimenery settings of the mesh according to your needs
     */
	constructor()
	{
		this.gemetry = SomehowCreateAppropriateGeometryObject();
	}

	/**
     * Update the mesh geometry with the data received from RYSKUrl
	 */
	update(uvs,indices,vertices)
	{
		this.geometry.setUV(uvs);
		this.geometry.setIndices(indices);
		this.geometry.setVertices(vertices)
	}
}
```

Once you call ``MeshGenerator.run()`` and ``MeshGenerator.play()``, your ``CustomMesh`` object should start to receive
the data and update itself. What is still missing however, is a texture. That one can be constructed either from
canvas HTML element or from video HTML element. The former is recommend due to the better syncing - canvas gets redrawn only
once the previous request for the decoded data was resolved, whilest the video may accidently display a frame or two before 
it is automatically paused which may result in the texture ill fitting the mesh. This is particularly prominent in
``@mantisvision/ryskstream`` where the video isn't paused due to realtime nature of the mediastream.

Let's say you create another file with the class for the texture called ``CustomTexture.js``:
```javascript
class CustomTexture
{
	/**
	 * Again, do some preparation for the rendering.
	 */
	constructor(canvas)
	{
		this.canvas = canvas;
	}
	
	/**
	 * You shall call this method periodically once the new data for the mesh arrived, as it also means the canvas
	 * with the texture got redrawn with the new frame.
	 */
	update()
	{
		//... somehow upload data from the canvas to the videomemory in order to redraw the texture
	}
}
```
A strange bug was noticed with PlayCanvas library and Firefox or older Safari on Mac. The canvas had to be copied to a different
canvas prior to uploading to the memory, otherwise syncing issues occured. Chrome as well as a newer Safari were unnefected
by the bug. Three.js worked correctly on every browser without the need to copy the canvas. Thus, should you experience
a similar behavior with your integration, try copying canvas to a temporary one in the update method first.

Now your ``CustomMesh.js`` will look something like this:
```javascript
import CustomTexture from "./CustomTexture.js";

export default class CustomMesh
{
	/**
     * Do some prelimenery settings of the mesh according to your needs
     */
	constructor()
	{
		this.gemetry = SomehowCreateAppropriateGeometryObject();
	}

	createTexture(canvas)
	{
		this.texture = new CustomTexture(canvas);
	}

	/**
     * Update the mesh geometry with the data received from RYSKUrl
	 */
	update(uvs,indices,vertices)
	{
		// Note! You may first need to update the texture and only then the geometry or vice versa. You'll probably need
		// to test and find out what produces the most stable result.
		this.texture.update();
		this.geometry.setUV(uvs);
		this.geometry.setIndices(indices);
		this.geometry.setVertices(vertices);
	}
}
```

And now back to your ``MeshGenerator.js``
```javascript
import RYSKUrl from "@mantisvision/ryskurl";
import CustomMesh from "./CustomMesh.js";
import { RyskEvents } from "@mantisvision/utils";

export default class MeshGenerator extends RYSKUrl
{
	constructor(videourl,dataurl,framebuffer = 50)
	{
		super(videourl,dataurl,framebuffer);
		this.mesh = new CustomMesh();

		this.on(RyskEvents.dataDecoded,data => 
		{// each time a new set of data is decoded, pass it to the mesh
			const { uvs, indices, vertices } = data;
			this.mesh.update(uvs,indices,vertices);
		});

		this.running = false;
	}

	async run()
	{
		if (!this.running)
		{
			this.htmlElements = await super.run();
			this.mesh.createTexture(htmlElements.canvas);
			this.running = true;
		}
		return this.htmlElements;
	}
}
```

You can now use your ``MeshGenerator`` class in the original script from the first phase:

```javascript
import MeshGenerator from "./MeshGenerator.js";
import { RyskEvents, MantisLog } from "@mantisvision/utils";

MantisLog.SetLogLevel(MantisLog.DEBUG);

const ryskObj = new MeshGenerator(videoUrl,dataUrl,50);

ryskObj.loop = true;

ryskObj.on(RyskEvents.error, console.error);

// these variable help to track whether video is buffering
var buffering = false;

ryskObj.on(RyskEvents.buffering, () => 
{//video is buffering
	buffering = true;
	ryskObj.setVolume(0);
});

ryskObj.on(RyskEvents.buffered, () => 
{//video is buffered, unmute it after a delay
	buffering = false;
	setTimeout(() => 
	{
		if (!buffering) ryskObj.setVolume(1.0);
	},400);
});

ryskObj.run().then( htmlElements => 
{
	const mesh = ryskObj.mesh;
	// ... and now you can do something with the mesh, e.g. put it into the scene
}).catch(console.error);

ryskObj.play().then(() => 
{// only unmute video once it's playing and only after a certain timeout
	setTimeout(() => 
	{
		if (!buffering) ryskObj.setVolume(1.0);
	},400);
});

// periodically update rysk object so it reads the frames from the video and pairs it with the data
const animate = () => 
{
	requestAnimationFrame(animate);
	ryskObj.update();
};
requestAnimationFrame(animate);
```

## Bundling
When you bundle the libraries with your code, you have to remember that one of the dependency uses webassembly file
(specifically ``@mantisvision/ryskwasm``) and others (``@mantisvision/ryskurl`` and ``@mantisvision/ryskstream``) utilize
webworkers. Your bundler might need a special configuration in order to properly pack all of that together.

For instance, if you use Webpack 5, you might need to add the following configuration to ``webpack.config.js`` you use 
for building your project:
```javascript
...
module: {
	{
		test: /\.wasm$/,
		type: 'asset/resource'
	},
...
```
As for the webworkers, Webpack 5 should by itself automatically emit seperate files containing their code. This is because in both
``@mantisvision/ryskurl`` and ``@mantisvision/ryskstream``, the workers are created similar to this:
```javascript
const worker = new Worker(new URL("./package.worker.js",import.meta.url));
```
Webpack 5 will automatically recognize this code and does what is necessary.
