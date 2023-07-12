# Synchronizer

This package contains a helper ``VideoSync`` class which can be used to synchronize playback of multiple ``RYSKUrl`` (or ``RYSKUrl`` derived) objects and/or ``HTMLVideoElement`` objects.

``VideoSync`` class can be instantiated multiple times and each instance can carry its own group of synchronized objects. The synchronization relies heavily on an external time synchronization object class which must be injected into the constructor as its first parameter. It is highly recommended to use [TimingObject from timingsrc project](http://webtiming.github.io/timingsrc/index.html), specifically [v3](https://webtiming.github.io/timingsrc/lib/timingsrc-esm-v3.js). Later on, Timing object might become [standard in the web browsers](https://webtiming.github.io/timingobject/), so no external library will be needed.

```javascript
import * as TIMINGSRC from "https://webtiming.github.io/timingsrc/lib/timingsrc-esm-v3.js";
import VideoSync from "@mantisvision/synchronizer";

const synchronizer = new VideoSync(TIMINGSRC.TimingObject);
```

The synchronizer internally uses the provided ``TimingObject`` class to create its instances in order to match the timestamps among the given videos/RYSK objects. if some of the video starts to fall behind the time from the the ``TimingObject`` instance, the library first increases its playback rate and in case of a big time difference it jumps ahead to the correct timestamp. Reversed principle applies if the video is instead too fast.

If the videos which should be synchronized are of different length, the longest one is played in its entirety while the rest stop at their last frame. If they are set to loop, they'll loop only once the longest video reaches its end.

If any video pauses due to buffering, all the rest of the videos pause as well. Be mindful that if the synchronized videos are of high bitrate and the client is on a slow network, this may result in a stuttering of the whole playback.

## Install
You can install this package using one of the following commands for either yarn or npm
```
yarn add @mantisvision/synchronizer
npm install @mantisvision/synchronizer
```

## Usage
You can either import ``VideoSync`` object from the package like this:
```javascript
import VideoSync from "@mantisvision/synchronizer";
```
Or you can simply use ``MantisSynchronizer.js`` script from the ``dist`` folder of the downloaded package as a standalone script, since the package itself uses UMD and has but a weak dependency on ``@mantisvision/utils`` and ``@mantisvision/ryskurl`` (the latter only for the type definitions for Typescript):
```javascript
import "my_app_src/MantisSynchronizer.js";
import { TimingObject } from "https://webtiming.github.io/timingsrc/lib/timingsrc-esm-v3.js";

const synchronizer = new window["@mantisvision/synchronizer"].default(TimingObject);
```

Alternatively, you can also use the minified version ``dist/MantisSynchronizer.min.js``
```html
<script src="./MantisSynchronizer.min.js"></script>
<script type="module">
import { TimingObject } from "https://webtiming.github.io/timingsrc/lib/timingsrc-esm-v3.js";

const synchronizer = new window.RyskSynchronizer(TimingObject);
</script>
```
You can pass videos to the ``VideoSync`` object using ``addMedia`` method and remove them using ``removeMedia`` method.
```javascript
const ryskObj1 = new URLMesh(videourl1,dataurl1);
const ryskObj2 = new URLMesh(videourl2,dataurl2);

// run method must still be called manually outside of the synchronizer
ryskObj1.run(mesh => {...});
ryskObj2.run(mesh => {...});

synchronizer.addMedia([ryskObj1, ryskObj2]);
...
synchronizer.removeMedia([ryskObj1, ryskObj2]);
```
Both methods accept either ``HTMLVideoElement`` or objects derived from ``RYSKUrl`` from ``@mantisvision/ryskurl`` (so for instance even ``URLMesh`` from ``@mantisvision/ryskthreejs`` or ``@mantisvision/ryskplaycanvas``). They can be passed individually or as an array. Internally, ``VideoSync`` wraps the objects into a class which implements ``SynchronizableObject`` interface (visible only if using TypeScript). You can also implement this interface yourself, wrap the ``HTMLVideoElement`` or ``RYSKUrl`` in it on your side and then pass this wrapper to the ``adMedia``. This is, however, meant only for experience users since the inner implementation of the ``SynchronizableObject`` object interface may cause unforeseen complications with the synchronization of the videos.

If a new video is passed to the synchronizer once it's playing videos, the synchronizer automatically sets the timestamp of this new video to the current internal timestamp of the synchronizer. Also, if it's the longest video, a "durationchange" event is emitted. The same event is emitted when the longest video is removed from the synchronizer.

Please notice that if you pass ``RYSKUrl`` object, you still have to call ``init()`` / ``run()``  method manually outside of the synchronizer. This is because the they very often resolve with the data which may be of direct use to you (e.g. ``RYSKUrl.init()`` resolves with the canvas and video, ``URLMesh.run()`` with the mesh object etc.).

### Autoplay
You can turn on/off the autoplay by calling ``setAutoplay(enabled)`` method where ``enabled`` is either true or false
Alternatively, autoplay is turned on by calling ``autoplayAfter(count)`` where ``count`` is the number of videos that need to be passed to the ``VideoSync`` object in order to start the autoplay:

```javascript
//automatically play after two videos have been passed
synchronizer.autoplayAfter(2);

const ryskObj1 = new URLMesh(videourl1, dataurl1);
ryskObj1.run(mesh => {...});
synchronizer.addMedia(ryskObj1);

const ryskObj2 = new URLMesh(videourl2, dataurl2);
ryskObj2.run(mesh => {...});
synchronizer.addMedia(ryskObj2);
// synchronizer now starts playing the videos
```

### Play / Pause / Stop / Volume
``VideoSync`` class provides ``play()``, ``pause()`` and ``stop()`` methods for playing, pausing and stopping of the videos it currently manages. You must no longer call these methods directly on the passed objects because that would mess up with the internal synchronizations of the videos. ``VideoSync`` object will also on itself automatically pause its videos if any of them starts buffering either video or RYSK data.

### Jumping to a different timestamp
``VideoSync`` class provides ``jumpAt(timestamp)`` method which allows you to change the current timestamp of all the managed videos to the given value (in seconds). It's possible that the new timestamp will be higher than the duration of some of those videos. In such a case, they stop playing and only the videos with a sufficient duration jump to the desired timestamp. Again, you should not change timestamp of the managed videos yourself because that may lead to troubles with the synchronization.

### Setting volume
In order to change the volume of the underlying videos, you should call ``setVolume()`` method of the ``VideoSync`` object. It takes two arguments:
1. level of the volume - if 0, the videos will mute, if 1, they play in the standard strength. Bear in mind that Some browsers may only recognize values 0 and 1.
2. RYSKUrl or HTMLVideoElement (or an array of them) which should afflicted by the change. You can use this parameter to set the volume only of some of the managed videos. If the second parameter isn't provided, all of the managed videos (even those added later on) will be set to the new volume.

By default, the volume of Synchronizer is set to 0, so you have to call ``setVolume`` manually at least once to set to to an appropriate value. This is by design because some browsers may want to autoplay videos only if they're mute.

```typescript
const ryskObj1 = new URLMesh(videourl1,dataurl1);
synchronizer.addMedia(ryskObj1);
synchronizer.setVolume(1); //ryskObj1 now has volume 1

const ryskObj2 = new URLMesh(videourl2,dataurl2);
synchronizer.addMedia(ryskObj2); //ryskObj2 volume has also been set to 1 because of the previous setVolume call

synchronizer.setVolume(0, ryskObj1); //sets only the ryskObj1 to mute; ryskObj2 sound continues to be 1
```

### Setting videos to loop
There are two ways to set the videos to loop. You can set the loop parameter directly on the ``HTMLVideoElement`` or ``RYSKUrl`` object BEFORE you pass it to the ``VideoSync`` object through the ``addMedia()`` method. If you wish to (un)set the loop of the media after you've passed to ``VideoSync`` object, use the ``setLoop(media, loop)`` method of the ``VideoSync``. The first parameter is the media object (or array of media objects), the second parameter is true if they should loop or false if they shouldn't:
```javascript
const ryskObj1 = new URLMesh(videourl1,dataurl1);
const ryskObj2 = new URLMesh(videourl2,dataurl2);

ryskObj1.run(mesh => {...});
ryskObj2.run(mesh => {...});

synchronizer.addMedia([ryskObj1, ryskObj2]);
synchronizer.setLoop([ryskObj1, ryskObj2]);
```
### Events
You can use ``on()`` and ``off()`` methods do attach/detach event listeners to the ``VideoSync`` object. The events are described by the ``VideoSyncEvents`` enum:
```typescript
export enum VideoSyncEvents {
	timeupdate = "timeupdate", // fired each time the internal TimeObject emits "timeupdate"
	durationchange = "durationchange", // fired when the new longest video is added or the longest video is removed
	ended = "ended", // fired when the longest video in VideoSync stops playing and no video is supposed to loop
	paused = "paused", // fired when the playing is paused
	playing = "playing" // fired when the playing continues
};
```

``timeupdate`` is similar to the timeupdate event emitted by a progress in o ``HTMLVideoElement``. The main difference is that the listeners obtains the current timestamp of the ``VideoSync`` object directly as its parameters.

``durationchange`` signals the duration of the longest currently playing video managed by the ``VideoSync`` object. This event is fired e.g. when a new, longer video is added to the ``VideoSync`` or if the longest video is removed or after the loop if the longest video wasn't set to loop (for example you've added a short 5 second video and a longer 10 second video and set only the shorter one to loop. At the first play, the duration is going to be 10 seconds, but once the ``VideoSync`` object loops, only the shorter video loops, so the "durationchange" event is fired and the duration changes to 5 seconds)

These two events can be used for instance to set the progress bar showing the current state of the playback:
```javascript
videoSync.on("timeupdate",newTimestamp => 
{//progressbar is some HTMLProgressElement defined earlier
	progressbar.value = newTimestamp;
});

videoSync.on("durationchange",newDuration => 
{//progressbar is some HTMLProgressElement defined earlier
	progressbar.max = newDuration;
});
```

## API
```typescript
/**
 * Create a new instance of VideoSync class
 * @param classPrototype the class passed as the parameter will be used to contstruct the internal Timing Object. It's highly recommended to use the Timing Object from here: https://webtiming.github.io/timingsrc/lib/timingsrc-esm-v3.js
 */
constructor(classPrototype: TimingClass)
```
```typescript
/**
 * Returns the duration of the longest currently playing video. 
 * This may change with the time as new videos are added or existing are looped.
 * @returns duration of the longest currently playing video in seconds
 */
getDuration();
```
```typescript
/**
 * Sets the number of medias after which the Video sync starts playing videos.
 * This also automatically sets autoplay to true.
 * @param addedMedia how many medias must be added before VideoSync au
 */
autoplayAfter(addedMedia: number): this;
```
```typescript
/**
 * Sets which renderer should loop and which shouldn't
 * @param media video to loop
 * @param value true if it should, false if it shouldn't
 */
setLoop(media: HTMLMediaElement, value: boolean): this;
setLoop(media: RYSKUrl, value: boolean): this;
setLoop(media: SynchronizableObject, value: boolean): this;
setLoop(media: (SynchronizableObject|RYSKUrl|HTMLMediaElement)[], value: boolean): this;
```
```typescript	
/**
 * Check if this VideoSync object was paused ba a user
 * @returns true if it was, false otherwise
 */
isPaused();
```
```typescript
/**
 * Checks if this object is set to autoplay.
 * @returns true if it is, false otherwise
 */
isAutoplay();
```
```typescript
/**
 * Sets the autoplay of this VideoSync object to either true or false (default).
 * @param val true if the VideoSync should autoplay, false otherwise
 * @returns this object for chaining
 */
setAutoplay(val: boolean): this;
```
```typescript	
/**
 * Attach an event listener
 * @param event name of the event from VideoSyncEvents enum
 * @param callback callback which receives either the current timestamp ("timeupdate") or the new longest duration ("durationchange") in seconds
 */
on(event: VideoSyncEvents.durationchange|VideoSyncEvents.timeupdate, callback: (data: number) => void): this;
on(event: VideoSyncEvents.ended|VideoSyncEvents.paused|VideoSyncEvents.playing, callback: () => void): this;
```
```typescript	
/**
 * Detach an event listener
 * @param event name of the event from VideoSyncEvents enum
 * @param callback callback to detach
 */
off(event: VideoSyncEvents.durationchange|VideoSyncEvents.timeupdate, callback: (data: number) => void): this;
off(event: VideoSyncEvents.ended|VideoSyncEvents.paused|VideoSyncEvents.playing, callback: () => void): this;
```
```typescript
/**
 * Returns the list of all the media which were added to this VideoSync object using addMedia method.
 * @returns array of all the objects added to this VideoSync object
 */
getMedia();
```
```typescript
/**
 * Adds media to this VideoSync object. 
 * If this is the first time addMedia is called and autoplay of the VideoSync object was set to true (by default it's false),
 * and noone has called autostartAfter method, VideoSync will autoplay automatically after the method ends.
 * @param media can be either instance of RYSKUrl (including descendants; e.g. from @mantisvision/ryskthreejs), HTMLVideoElement or an object which implements SynchronizableObject interface
 */
addMedia(media: SynchronizableObject): Promise<void>;
addMedia(media: RYSKUrl): Promise<void>;
addMedia(media: HTMLVideoElement): Promise<void>;
addMedia(media: (HTMLVideoElement|RYSKUrl|SynchronizableObject)[]): Promise<void>;
```
```typescript
/**
 * Remove a media from this VideoSync object
 * @param media 
 */
removeMedia(media: SynchronizableObject): this;
removeMedia(media: RYSKUrl): this;
removeMedia(media: HTMLVideoElement): this;
removeMedia(media: (HTMLVideoElement|RYSKUrl|SynchronizableObject)[]): this;
```
```typescript
/**
 * Empty the object and clean. This method should be called when the work with the VideoSync object is finished.
 */
finish();
```
```typescript
/**
 * Asks to play the manged videos (the buffering may delay the actual play)-
 */
async play();
```
```typescript
/**
 * Pauses all of the managed videos.
 */ 
async pause();
```
```typescript
/**
 * Jump to a specific timestamp in all the synced media
 * @param timestamp time to jump in seconds
 */
async jumpAt(timestamp: number);

```
```typescript
/**
 * Resets the entire playback; i.e. stops playing the videos and sets them back to the beginning. 
 */
async stop();
```
```typescript
/**
 * Sets the volume of the managed videos to the given level.
 * @param level level of the volume (0 is mute, 1 is standard)
 * @param media specific (or an array of specific) videos which should have their volume adjusted
 */
setVolume(level: number): this;
setVolume(level: number, media: RYSKUrl|HTMLVideoElement|SynchronizableObject): this;
setVolume(level: number, media: (RYSKUrl|HTMLVideoElement|SynchronizableObject)[]): this;
```

## Sample
You can find an example usage in these two samples:
- [Dedicated sample project](https://github.com/MantisVision/webUtils/tree/master/samples/synchronized)
- [Standalone sample project](https://github.com/MantisVision/webUtils/tree/master/samples/standalone)

## Release notes

### 0.2.0
Added ``setVolume()`` method and new events: paused, playing and ended.

#### 0.2.3
When jumping into a timestamp which is higher than some of the videos' durations, those videos automatically jump to their last frame.

#### 0.2.4
``type`` field was set to ``module`` in ``package.json`` for greater inter-operability.

### 0.3.0
- Video synchronizer can now handle dynamic duration changes of the managed media.
- some of tha callbacks are now registered not on the underlying video element/RYSKUrl object, but directly on the wrapper which implements ``SynchronizableObject`` interface