# RYSKMesh
This package generates and updates a THREE.js mesh based on given video and frame data. Data should be submitted continuesly and preferably in sync (or ahead) of video frames, otherwise some parts of the video are skipped (in case of "live" video streaming) or the video is paused till the proper data aren't delivered (in case of pre-recorder video).

It is advisable to periodically call ```update``` method of RYSKMesh object in order to update the look of the resulting THREE.js mesh with new video/data frame. If the browser supports "requestVideoFrameCallback" of video element, RYSKMesh wil get updated automatically. However, not every browser does, so to be sure the THREE.js mesh will reflect progress in video, ```update``` method should be called anyway in window.requestAnimationFrame callback or in a similar way.

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/ryskmesh
npm install @mantisvision/ryskmesh
```

## Usage:
You can use RYSKMesh for instance like this:
```javascript
import { RYSKMesh } from "@mantisvision/ryskmesh";

async function updateMeshWithData(ryskMesh)
{
	while (true)
	{// somehow get decoded data for a frame using @mantisvision/downloader or directly @mantisvision/decoder
		const decodedData = await getDecodedFrameData(); 
		if (decodedData !== null)
		{
			ryskMesh.addData(frameNo,vertices,uvs,indices); //pass the data to ryskMesh
		}else break;
	}
}

const ryskMesh = new RYSKMesh(videoElem);
const threeMesh = ryskMesh.getMesh();

const animate = () => 
{
	if (ryskObj !== null)
	{
		requestAnimationFrame(animate);
		ryskMesh.update();
	}
};
requestAnimationFrame(animate);
updateMeshWithData(ryskMesh);

// do something with threeMesh and call dispose on ryskMesh once you are finished
ryskMesh.dispose();

```
Aside from RYSKMesh, the package also exports Helper object which is used by the package when it needs to create a canvas
element. By default, it does it through
```javascript
document.createElement("canvas");
```
However, you might want to provide your own method in case your application has no access to the global document object.
You can do this like this:
```javascript
import { Helper } from "@mantisvision/ryskmesh";

Helper.setGenerateCanvas(function()
{//your own code to generate the canvas element
	const newCanvas = myOwnMethod();
	return newCanvas;
});
```

## Public API

### RYSKMesh
```javascript
/**
 * Creates a new instance of RYSKMesh which serves to construct THREE.js mesh from the given video and data which
 * the object needs to be fed with periodically.
 * @param {DOMElement} srcVideoElem source video element which is streaming a file
 * @param {Boolean} realtime indicates whether video is considered realtime (i.e. a constant stream). Such a video shouldn't be paused whilest waiting for a proper RYSK data.
 * @param {Integer} videoWidth you can specify width of the video. If set to null (default), widh will be read from the srcVideoElem. If you set this parameter, the srcVideoElem will be stretched (or shrunk) to accomodate the desired size.
 * @param {Integer} videoHeight see the previous parameter
 * @param {Integer} frameBufferSize set the size of the framebuffer for the data describing the frames (i.e. UVs, indices, vertices)
 */
constructor(srcVideoElem,realtime = false,videoWidth = null, videoHeight = null, frameBufferSize = 100);
```
```javascript
/**
 * Returns three.js Group which represents the mesh generated from the video and data
 * @returns {THREE.Mesh}
 */
getMesh();
```
```javascript
/**
 * Registers a callback which is called just once (!) when the data buffer is filled with less than from one third;
 * that could be used to once again resume the download of the data if it was paused before (e.g. due to too many
 * data downloaded ahead).
 * @param {callable} callback function to call as a callback. Its only parameter is an Integer which equals to one third of data buffer length (e.g. length is 60, param will be 20).
 * @returns {undefined}
 */
onceSmallerDiff(callback);
```
```javascript
/**
 * Add geometry data for the mesh and given frame 
 * @param {Integer} frameNo frame number for which the data should be delivered
 * @param {Float32Array} vertices 
 * @param {Float32Array} uvs
 * @param {Uint8Array | Uint16Array | Uint32Array} indices
 */	
addData(frameNo,vertices,uvs,indices);
```
```javascript
/**
 * This method must be called each time the model should get updated. Ordinary it can be called in 
 * "window.requestAnimationFrame" callback.
 * NOTE: In theory, it shoudn't be necessary to call this method if the videoElem passed in constructor of RYSKMesh
 * supports setting of "requestVideoFrameCallback". However, many browsers don't, so it safer to call this method
 * manually.
 */
update();
```
```javascript
/**
 * Resumes playing of the given video.
 * @returns {undefined}
 */
videoPlaying();
```
```javascript
/**
 * Pauses the current video
 * @returns {undefined}
 */
videoPaused();
```
```javascript
/**
 * Returns the current frame number which is being processed.
 * @returns {Number|integer}
 */
getCurrentVideoFrame();
```
```javascript
/**
 * Reset the whole data buffer. It is used in the contstructor and if the user changes current timestamp of the video
 * (e.g. using seek or hitting stop button and returning video to the beginning), this method shoud be called as well.
 */
resetBuffer();
```
```javascript
/**
 * Defacto a destructor. This method should be called after the object is no longer needed in order to clean after
 * itself.
 * @returns {undefined}
 */
dispose();
```

### Helper
```javascript
/**
 * This method serves for generating the canvas element. If document object is unavailible (e.g. in node.js), it should
 * be replaced with an appropriate substitute which will return canvas. The replacement method can be set using
 * Helper.setGenerateCanvas(replacement).
 * @returns {Element} Canvas element
 */
generateCanvas: function();
```
```javascript
/**
 * Set custom function for generating the canvas.
 * @param {callable} customMethod your custom function which returns canvas element.
 */
setGenerateCanvas: function(customMethod);
```
