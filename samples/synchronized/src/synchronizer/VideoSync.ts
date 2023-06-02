import { MantisLog } from "@mantisvision/utils";
import RYSKUrl from "@mantisvision/ryskurl";

import VideoWrapper from "./VideoWrapper";
import { CallbackType, SynchronizableObject } from "./Types";
import TimingObject from "./iTimingObject";
import RYSKUrlWrapper from "./RYSKUrlWrapper";

export default class VideoSync<TimingClass extends TimingObject>
{
	protected _timingClass: TimingClass;

	// Hash of all synchronizable objects to their source objects
	protected _synchronizableObjects = new Map<HTMLElement|RYSKUrl|SynchronizableObject, SynchronizableObject>();

	// Object which is used to synchronize all the synchronizable objects
	protected _timingObject: TimingObject|null = null;

	// Last marked timestamp from the timing objects
	protected _currentTimestamp = 0;

	// in case the objects are paused, this property keeps the timestamp at which the pause was hit
	protected _pausedTimestamp = 0;

	// objects which currently can be sinced together with their duration (excludes ender and buffering objects)
	protected _syncObjs = new Map<SynchronizableObject,number>();

	// set of all the synchronizable objects which should loop
	protected _looping = new Set<SynchronizableObject>();

	// all the synchronizable objects which have already ended
	protected _ended = new Map<SynchronizableObject,number>();

	// all the synchronizable objects which are buffering
	protected _buffering = new Map<SynchronizableObject,number>();

	// all the listeners attached to synchronizable objects (so they can be easily detached)
	protected _listeners = new Map<SynchronizableObject,Map<CallbackType,(data?:any) => void >>;

	// the longest currently playing synchronizable object
	protected _longestMedia?: SynchronizableObject;

	// duration of the longest synchronizable object
	protected _fullDuration = 0;

	// true if the VideoSync object is in its "first start" phase; i.e. is waiting till all the synchronizable objects are added
	protected _firstStart = true;

	// whether the video should automatically autostart or not
	protected _autostart = false;

	// how many synchronizable objects this VideoSync should wait for
	protected _autostartAfter: number = -1;

	// how many synchronizable objects have been already buffered
	protected _firstBuffered = 0;

	// true if the current state of the VideoSynced is paused
	protected _paused = true;
	
	protected _callbacks = new Map<"timeupdate"|"durationchange",Set<(data: number) => void>>();
	
	protected _userStatePlay = -1; // -1 not playing, 0 - changing to playing, 1 - playing 
	protected _libStatePlay = 0; // -1 not playing, 0 - changing to playing, 1 - playing 
	protected _promise: Promise<void>|null = null;

	/**
	 * Create a new instance of VideoSync class
	 * @param loop boolean Marks whether the videos should loop
	 */
	constructor(classPrototype: TimingClass)
	{
		this._timingClass = classPrototype;
		this._callbacks.set("timeupdate",new Set());
		this._callbacks.set("durationchange",new Set());
	}

	/**
	 * Returns the duration of the longest current playing. 
	 * This may change with the time as new videos are added or existing are looped.
	 * @returns duration of the longest current playing video in seconds
	 */
	getDuration()
	{
		return this._fullDuration;
	}

	/**
	 * Sets the number of medias after which the Video sync starts playing videos.
	 * This also automatically sets autoplay to true.
	 * @param addedMedia how many medias must be added before VideoSync au
	 */
	autoplayAfter(addedMedia: number)
	{
		this._autostart = true;
		MantisLog.debug("Play after " + addedMedia + " added media","yellow","black");
		if (this._firstStart)
		{
			const diff = addedMedia  - this._buffering.size - this._ended.size - this._syncObjs.size;
			if (diff <= 0) 
			{
				this._firstStart = false;
				this.play();
			}else this._autostartAfter = addedMedia;
		}
	}

	setLoop(media: HTMLMediaElement, value: boolean): this;
	setLoop(media: RYSKUrl, value: boolean): this;
	setLoop(media: SynchronizableObject, value: boolean): this;
	setLoop(media: (SynchronizableObject|RYSKUrl|HTMLMediaElement)[], value: boolean): this;

	/**
	 * Sets which renderer should loop and which shouldn't
	 * @param renderer renderer to loop
	 * @param value true if it should, false if it shouldn't
	 */
	setLoop(media: any, value: boolean): this
	{
		if (Array.isArray(media))
		{
			for (var m of media)
			{
				this.setLoop(m,value);
			}
		}else
		{
			const syncObj = this._synchronizableObjects.get(media);
			if (syncObj)
			{
				this._setLoop(syncObj, value);
			}else throw new Error("Media hasn't been added to this VideoSync object (or it was already removed).");
		}
		return this;
	}
	
	/**
	 * Check if this VideoSync object was paused ba a user
	 * @returns true if it was, false otherwise
	 */
	isPaused()
	{
		return this._paused;
	}

	/**
	 * Checks if this object is set to autoplay.
	 * @returns true if it is, false otherwise
	 */
	isAutoplay()
	{
		return this._autostart;
	}

	/**
	 * Sets the autoplay of this VideoSync object to either true or false (default).
	 * @param val true if the VideoSync should autoplay, false otherwise
	 * @returns this object for chaining
	 */
	setAutoplay(val: boolean)
	{
		if (val && !this._autostart && this._firstStart)
		{//check if autoplay shouldn't start
			this._paused = false;
			this._autostart = val;
			this._checkAutoplay();
		}else this._autostart = val;
		return this;
	}
	
	/**
	 * Attach an event listener
	 * @param event either "timeupdate" (fired each time the lead video firest "timeupdate") or "durationchange" (fired when the new longest video is added) event
	 * @param callback callback which receives either the current timestamp ("timeupdate") or the new longest duration ("durationchange")
	 */
	on(event: "timeupdate"|"durationchange",callback: (data: number) => void)
	{
		if (this._callbacks.has(event))
		{
			this._callbacks.get(event)?.add(callback);
		}
	}
	
	/**
	 * Detach an event listener
	 * @param event either "timeupdate" or "durationchange"
	 * @param callback callback to detach
	 */
	off(event: "timeupdate"|"durationchange",callback: (data: number) => void)
	{
		if (this._callbacks.has(event))
		{
			this._callbacks.get(event)?.delete(callback);
		}
	}

	/**
	 * Returns the list of all the media which were added to this VideoSync object using addMedia method.
	 * @returns array of all the objects added to this VideoSync object
	 */
	getMedia()
	{
		return [...this._synchronizableObjects.keys()];
	}

	/**
	 * Adds media to this VideoSync object. 
	 * If this is the first addMedia is called and autoplay of the VideoSync object was set to true (by default it's false),
	 * and noone has called autostartAfter method, VideoSync will autoplay automatically after the method ends.
	 * @param media can be either instance of RYSKUrl (including descendants; e.g. from @mantisvision/ryskthreejs), HTMLVideoElement or an object which implements SynchronizableObject interface
	 */
	addMedia(media: SynchronizableObject): Promise<this>;
	addMedia(media: RYSKUrl): Promise<this>;
	addMedia(media: HTMLVideoElement): Promise<this>;
	addMedia(media: (HTMLVideoElement|RYSKUrl|SynchronizableObject)[]): Promise<this>;

	async addMedia(media: any): Promise<this>
	{
		if (this._firstStart && this._autostartAfter < 0)
		{
			if (Array.isArray(media))
			{
				if (media.length > 0) this.autoplayAfter(media.length);
				else return this;
			}else this.autoplayAfter(1);
		}

		if (Array.isArray(media))
		{
			const promises = [];
			for (var m of media)
			{
				promises.push(this.addMedia(m));
			}
			await Promise.all(promises);
		}else if (!this._synchronizableObjects.has(media))
		{
			let syncedObj: SynchronizableObject;

			if (media instanceof HTMLVideoElement)
			{
				syncedObj = new VideoWrapper(media);
			}else if (media instanceof RYSKUrl)
			{
				syncedObj = new RYSKUrlWrapper(media);
			}else
			{
				syncedObj = media;	
			}

			this._synchronizableObjects.set(media,syncedObj);
			await this._addMedia(syncedObj);
		}
		return this;
	}

	/**
	 * Remove a media from this VideoSync object
	 * @param media 
	 */
	removeMedia(media: SynchronizableObject): this;
	removeMedia(media: RYSKUrl): this;
	removeMedia(media: HTMLVideoElement): this;
	removeMedia(media: (HTMLVideoElement|RYSKUrl|SynchronizableObject)[]): this;

	removeMedia(media: any): this
	{
		if (Array.isArray(media))
		{
			for (var m of media)
			{
				this.removeMedia(m);
			}
		}else
		{
			const syncedObject = this._synchronizableObjects.get(media);
			if (syncedObject)
			{
				this._removeMedia(syncedObject);
				this._synchronizableObjects.delete(media);
			}
		}
		return this;
	}

/*******************************************************************************************************
 * 											PROTECTED METHODS
 *******************************************************************************************************/

	protected _setLoop(renderer: SynchronizableObject, value: boolean)
	{
		MantisLog.debug("Setting loop to: " + value,"yellow","black");
		renderer.loop = false;
		if (value) this._looping.add(renderer);
		else this._looping.delete(renderer);
	}

	/**
	 * Add media element to synchronization (currently either Syk or PlainVideo renderers are fully supported).
	 * The longest added media becomes the lead; the one used to sync all the others.
	 * @param mediaElem 
	 */
	protected async _addMedia(media: SynchronizableObject)
	{
		if (!this._listeners.has(media))
		{
			this._listeners.set(media,new Map());
			//if (this.isPaused()) await media.pause();

			this._setLoop(media,media.loop);
			const duration = await media.getDuration();
			MantisLog.debug("Is this paused? " + this.isPaused(),"aqua","black");

			if (duration !== null)
			{
				media.loop = false;

				if (media instanceof RYSKUrlWrapper)
				{
					this._attachListenersToSYK(media, duration);
				}else if (media instanceof VideoWrapper)
				{
					this._attachListenersToVideo(media,duration);
				}

				const timestamp = this._currentTimestamp;
				if (this._fullDuration < duration)
				{					
					this._fullDuration = duration;
					this._longestMedia = media;

					if (media.getCurrentTime() !== timestamp)
					{
						MantisLog.debug("New media jumps to timestamp " + timestamp,"yellow","black");
						media.jumpAt(timestamp);
					}
					this._callCallbacks("durationchange",this._fullDuration);
				}else if (timestamp <= duration)
				{					
					if (media.getCurrentTime() !== timestamp)
					{
						MantisLog.debug("New media jumps to timestamp " + timestamp,"yellow","black");
						media.jumpAt(timestamp);
					}
				}else
				{
					MantisLog.debug("New Video already ends " + timestamp + " duration is " + duration,"yellow","black");
					this._ended.set(media,duration);
				}

				if (this._firstStart) this._checkAutoplay();
				else if (this.isPaused()) media.pause();
				else media.play();
			}
		}
	}
	
	/**
	 * Remove a media from synchronization. This may result in a new media becoming the lead (the one which is used to sync the rest
	 * of media).
	 * @param media media to remove
	 */
	protected _removeMedia(media: SynchronizableObject)
	{
		if (this._listeners.has(media))
		{
			this._autostartAfter--;
			const isBuffering = this._buffering.has(media);

			this._detachAllListeners(media);
			if (this._looping.has(media))
			{
				this._looping.delete(media);
				media.loop = true;
			}
			
			this._syncObjs.delete(media);
			this._ended.delete(media);
			this._buffering.delete(media);
			if (this._longestMedia === media)
			{
				var longest: SynchronizableObject|null = null;
				var longestduration = 0;
				var iterArr = [this._syncObjs.entries(),this._buffering.entries(), this._ended.entries()];

				for (var iter of iterArr)
				{
					let entry;
					while (entry = iter.next().value)
					{
						if (entry[1] > longestduration)
						{
							longestduration = entry[1];
							longest = entry[0];
						}
					}
				}

				if (longest !== null)
				{
					this._longestMedia = longest;
					this._fullDuration = longestduration;
					if (this._currentTimestamp > longestduration)
					{//this means that the longest is already over
						this._lastVideoHasEnded(longest,longestduration);
					}
					this._callCallbacks("durationchange",longestduration);
				}
			}

			if (this._syncObjs.size + this._ended.size + this._buffering.size === 0)
			{//the last media was removed
				if (this._timingObject)
				{
					this._timingObject.off("timeupdate",this._timeupdate);
					this._timingObject = null;
				}
				
				this._currentTimestamp = 0;
				this._pausedTimestamp = 0;
				this._longestMedia = undefined;
				this._fullDuration = 0;	
				this._callCallbacks("durationchange",0);
				
			}else if (isBuffering && this._buffering.size === 0 && this._syncObjs.size > 0)
			{//this video was buffering and it was the only video which was buffering; that means the lock on playing should be released
				this._playLib();
			}
		}
		return this;
	}

	/**
	 * Empty the object
	 */
	finish()
	{
		if (this._timingObject)
		{
			this._timingObject.off("timeupdate",this._timeupdate);
			this._timingObject = null;
		}

		this._listeners.forEach((listeners, media) => 
		{
			this._detachAllListeners(media);
		});
		this._listeners.clear();

		this._syncObjs.forEach((duration,media) => 
		{
			media.loop = true;
		});
		this._syncObjs.clear();

		this._buffering.clear();
		this._ended.clear();
		this._longestMedia = undefined;
		this._callbacks.clear();
		this._looping.forEach(renderer => renderer.loop = true);
		this._looping.clear();
	}
	
	async play()
	{
		if (this._firstStart)
		{//play was hit by a user, so autoplay is no longet a concern
			this._firstStart = false;
		}
		await this._playUser();	
		this._paused = false;
	}
	
	async pause()
	{
		await this._pauseUser();
		this._paused = true;
	}
	
	/**
	 * Jump to a specific timestamp in all the synced media
	 * @param timestamp 
	 */
	async jumpAt(timestamp: number)
	{
		MantisLog.debug("Jumping to " + timestamp,"yellow","black");
		await this._pauseLib();
		this._callCallbacks("timeupdate",timestamp);
		this._currentTimestamp = timestamp;

		this._ended.forEach((duration,media) => 
		{
			if (duration >= timestamp)
			{
				this._syncObjs.set(media,duration);
				this._ended.delete(media);
			}
		});

		this._buffering.forEach((duration,media) =>
		{
			if (duration >= timestamp) this._syncObjs.set(media, duration);
			else this._ended.set(media,duration);
		});
		this._buffering.clear();

		MantisLog.debug("Jump to " + timestamp + " Ended are " + this._ended.size + " and SyncObj are " + this._syncObjs.size, "aqua", "black");
		await this._resetSync(timestamp);
		
		if (this._pausedTimestamp > 0)
		{
			this._pausedTimestamp = timestamp;
		}

		//after jump, some media which have already ended might be started a new which could change the timeline duration
		const iter = this._syncObjs.entries();
		let media:[SynchronizableObject,number];
		let longest: SynchronizableObject|null = null;
		let longestDuration: number = 0;
		while (media = iter.next().value)
		{
			if (media[1] > longestDuration)
			{
				longestDuration = media[1];
				longest = media[0];
			}
		}
		if (longest)
		{
			this._longestMedia = longest;
			this._fullDuration = longestDuration;
			this._callCallbacks("durationchange",longestDuration);
		}
		
		if (this._timingObject)
		{
			this._timingObject.update({ position: timestamp, velocity: 1 });
			if (timestamp === 0)
			{
				try
				{
					this._timingObject.on("timeupdate",this._timeupdate);
				}catch (err)
				{
					console.log("timeupdate already attached");
				}
			}
		}
		await this._playLib();
	}
	
	async stop()
	{
		await this.pause();
		if (this._timingObject)
		{
			this._timingObject.off("timeupdate",this._timeupdate);
			this._timingObject = null;
			this._callCallbacks("timeupdate",0);
		}
		this._currentTimestamp = 0;
		this._pausedTimestamp = 0;
		this._ended.forEach((duration,media) => 
		{//all the ended media will be runned again at the next play, because stop is essentially reset of the entire VideoSync object
			this._syncObjs.set(media,duration);
		});
		this._ended.clear();
		this._buffering.forEach((duration,media) => 
		{
			this._syncObjs.set(media,duration);
		});
		this._buffering.clear();
		const promises: Promise<void>[] = [];

		const iter = this._syncObjs.entries();
		let media: [SynchronizableObject, number];
		let longest: SynchronizableObject|null = null;
		let longestDuration: number = 0;

		while (media = iter.next().value)
		{
			promises.push(media[0].stop());
			if (media[1] > longestDuration)
			{
				longestDuration = media[1];
				longest = media[0];
			}
		}
		if (longest && longest !== this._longestMedia)
		{//change the duration of timeline after the stop method is called
			this._longestMedia = longest;
			this._fullDuration = longestDuration;
			this._callCallbacks("durationchange",longestDuration);
		}
		await Promise.allSettled(promises);
		await this._playLib();
	}

	protected async _loopVideos()
	{
		var iter = this._looping.values();
		MantisLog.debug("Looping " + this._looping.size + " media","aqua","black");
		let media: SynchronizableObject;
		while (media = iter.next().value)
		{
			if (media.playbackRate !== 1.0)
			{
				media.playbackRate = 1.0;
			}
			media.loopVideo();
		}
	}

	/**
	 * Set all the media in #syncObjs array to zero or a different timestamp.
	 * @param timestamp 
	 */
	protected async _resetSync(timestamp: number = 0)
	{
		const promises: Promise<void>[] = [];
		var iter = this._syncObjs.entries();
		let media: [SynchronizableObject,number];

		while (media = iter.next().value)
		{
			if (media[0].playbackRate !== 1.0)
			{
				media[0].playbackRate = 1.0;
			}
			if (media[1] >= timestamp)
			{
				if (media[0] instanceof RYSKUrlWrapper)
				{
					const ryskObj = media[0].getRYSKObject();
					if (ryskObj) promises.push(ryskObj.jumpAt(timestamp));
				}else
				{
					const mediaElem = media[0].getMediaElement();
					if (mediaElem) 
					{
						if (timestamp > 0)
						{
							if ("fastSeek" in mediaElem) 
							{//this is probably supported only on Safari
								mediaElem.fastSeek(timestamp);
							}else 
							{
								(<HTMLMediaElement>mediaElem).currentTime = timestamp;
							}
						}else
						{//this is due to the Safari's tendency to double-trigger video.ended if only the timestamp is set
							promises.push(mediaElem.play());
						}
					}
				}
			}else
			{
				this._ended.set(media[0], media[1]);
				this._syncObjs.delete(media[0]);
			}
		}
		await Promise.allSettled(promises);
	}
	
	protected _timeupdate = () =>
	{
		if (this._timingObject && !this.isPaused() && this._userStatePlay === 1 && this._libStatePlay === 1) 
		{//update videos only if they're not paused
			const newPosition = this._timingObject.query().position;
			const fromPrevious = newPosition - this._currentTimestamp;
			this._currentTimestamp = newPosition;
			if (newPosition >= 0.5)
			{//check only every half a second
				const iter = this._syncObjs.entries();
				let media: [SynchronizableObject,number];
				while (media = iter.next().value)
				{
					if (media[1] >= newPosition)
					{
						const diff = media[0].getCurrentTime() - newPosition;
						if (diff < 0.5 && diff > -0.5)
						{
							if (media[0].playbackRate !== 1.0) media[0].playbackRate = 1.0;
						}else if (diff > 1.5 || diff < -1.5)
						{
							if (media[0].playbackRate !== 1.0)
							{//reset playback rate after jump
								media[0].playbackRate = 1.0;
							}
							media[0].jumpAt(newPosition);
						}else if (diff >= 0.5)
						{
							if (diff < 0.75) media[0].playbackRate = 0.9;
							else if (diff < 0.9) media[0].playbackRate = 0.8;
							else if (diff < 1.2) media[0].playbackRate = 0.75;
							else media[0].playbackRate = 0.7;
						}else
						{
							if (diff < -1.2) media[0].playbackRate = 1.3;
							else if (diff < -0.9) media[0].playbackRate = 1.25;
							else if (diff < -0.75) media[0].playbackRate = 1.2;
							else media[0].playbackRate = 1.1;
						}
					}
				}

				this._callCallbacks("timeupdate",newPosition);
			}
		}
	};

	protected _lookForLongestAfterLoop() 
	{
		let iter = this._looping.values();
		let renderer: SynchronizableObject;
		let longest: SynchronizableObject|null = null;
		let longestDuration: number = 0;
		MantisLog.debug("Looking for the new longest from among " + this._ended.size + " ended and " + this._looping.size + " looping","aqua","black");
		while (renderer = iter.next().value)
		{
			const duration = this._syncObjs.get(renderer);
			if (duration && (duration > longestDuration || longest === null))
			{
				longestDuration = duration;
				longest = renderer;
			}
		}
		if (longest && longest !== this._longestMedia)
		{//switch the longest media 
			this._longestMedia = longest;
			this._fullDuration = longestDuration;
			MantisLog.debug("Found the new longest duration: " + longestDuration,"aqua","black");
			this._callCallbacks("durationchange",longestDuration);
		}
	}

	protected _checkAutoplay()
	{
		MantisLog.debug("Checking autoplay -- First start: " + this._firstStart + " Autostart after: " + this._autostartAfter + " first buffered: " + this._firstBuffered, "aqua", "black");
		if (this._autostart && this._firstStart && this._autostartAfter >= 0 && this._firstBuffered === this._autostartAfter)
		{
			this._firstStart = false;
			this._playLib();
			if (!this.isPaused()) this.play();
		}
	}

	protected _detachAllListeners(media: SynchronizableObject): this
	{
		const listeners = this._listeners.get(media);
		if (listeners)
		{
			const iter = listeners.entries();
			let listener: [CallbackType,(data?: any) => void];
			while (listener = iter.next().value)
			{
				switch (listener[0])
				{
					case "timeupdate":
						media.offTimeUpdate(listener[1]);
						break;

					case "buffering":
						if (media instanceof RYSKUrlWrapper) media.getRYSKObject()?.off("buffering", listener[1]);
						else media.getMediaElement()?.removeEventListener("waiting",listener[1]);
						break;

					case "buffered":
						if (media instanceof RYSKUrlWrapper) media.getRYSKObject()?.off("buffered", listener[1]);
						else media.getMediaElement()?.removeEventListener("playing",listener[1]);
						break;

					case "canplay":
						if (media instanceof RYSKUrlWrapper) media.getRYSKObject()?.off("dataBuffered", listener[1]);
						else media.getMediaElement()?.removeEventListener("canplay",listener[1]);
						break;

					case "ended":
						if (media instanceof RYSKUrlWrapper) media.getRYSKObject()?.off("videoEnded", listener[1]);
						else media.getMediaElement()?.removeEventListener("ended",listener[1]);
						break;

					default:
						break;
				}
			}
			this._listeners.delete(media);
		}
		return this;
	}
	
	protected _attachListenersToSYK(media: RYSKUrlWrapper, duration: number)
	{
		const ryskObj = media.getRYSKObject();

		if (ryskObj)
		{
			MantisLog.debug("Attaching to RYSK object","yellow","black");

			if (this._firstStart)
			{
				if (ryskObj.firstBuffering === false)
				{//the first buffering hasn't yet occured
					this._buffering.set(media, duration);
					this._attachFirstBufferingListenerToSyk(media,duration);
				}else
				{
					this._syncObjs.set(media,duration);
					this._firstBuffered++;
					this._checkAutoplay();
				}
			}else this._syncObjs.set(media,duration);

			this._attachBufferingListenerToSyk(media, duration)
				._attachBufferedListenerToSyk(media, duration)
				._attachEndedListenerToSyk(media, duration);
		}
	}

	protected _attachFirstBufferingListenerToSyk(media: RYSKUrlWrapper, duration: number): this
	{
		const listenersMap = this._listeners.get(media);
		if (listenersMap && !listenersMap.has("canplay"))
		{
			const firstDataBufferedOnRYSK = () =>
			{
				const listenersMap = this._listeners.get(media);
				if (listenersMap)
				{
					listenersMap.delete("canplay");
					media.getRYSKObject()?.off("dataBuffered",firstDataBufferedOnRYSK);

					if (this._currentTimestamp > duration)
					{
						this._ended.set(media,duration);
					}else
					{
						this._syncObjs.set(media,duration);
					}
					
					this._buffering.delete(media);
					if (this._firstStart)
					{
						this._firstBuffered++;
					}else if (this._buffering.size === 0)
					{
						this._playLib();
						if (!this.isPaused()) this._playUser();
					}
					this._checkAutoplay();
				}
			};
			listenersMap.set("canplay",firstDataBufferedOnRYSK);
			media.getRYSKObject()?.on("dataBuffered",firstDataBufferedOnRYSK);
		}else throw "Attempt to attach second listener to ended";
		return this;
	}

	protected _attachEndedListenerToSyk(media: RYSKUrlWrapper, duration: number): this
	{
		const listenersMap = this._listeners.get(media);
		if (listenersMap && !listenersMap.has("ended"))
		{
			const callback = () => 
			{
				this._videoHasEnded(media, duration);
			};
			listenersMap.set("ended",callback);
			media.getRYSKObject()?.on("video.ended",callback);
		}else throw "Attempt to attach second listener to video.ended";
		return this;
	}

	protected _attachBufferingListenerToSyk(media: RYSKUrlWrapper, duration: number): this
	{
		const listenersMap = this._listeners.get(media);
		if (listenersMap && !listenersMap.has("buffering"))
		{
			const callback = () => 
			{
				if (!this._ended.has(media))
				{
					this._buffering.set(media,duration);
					this._syncObjs.delete(media);
					this._pauseLib().then(() =>
					{
						MantisLog.debug("After pause the " + this._buffering.size + " objects still buffering","yellow","black");
					});
				}
			};
			listenersMap.set("buffering",callback);
			media.getRYSKObject()?.on("buffering",callback);
		}else throw "Attempt to attach second listener to buffering";
		return this;
	}

	protected _attachBufferedListenerToSyk(media: RYSKUrlWrapper, duration: number): this
	{
		const listenersMap = this._listeners.get(media);
		if (listenersMap && !listenersMap.has("buffered"))
		{
			const callback = () => 
			{
				if (!this._ended.has(media) && this._buffering.has(media))
				{
					if (this._currentTimestamp > duration)
					{
						this._ended.set(media,duration);
					}else
					{
						this._syncObjs.set(media,duration);
					}
					this._buffering.delete(media);
					if (this._buffering.size === 0)
					{
						this._playLib();
						if (!this.isPaused()) this._playUser();
					}else if (this._userStatePlay === -1 || this._libStatePlay === -1)
					{
						media.pause();
					}
				}
			};
			listenersMap.set("buffered",callback);
			media.getRYSKObject()?.on("buffered",callback);
		}else throw "Attempt to attach second listener to buffered";
		return this;
	}
		
	protected _attachListenersToVideo(media: VideoWrapper,duration: number)
	{
		const mediaElement = media.getMediaElement();
		if (mediaElement)
		{
			if (this._firstStart)
			{
				if (mediaElement.readyState >= 2)
				{//video can be played
					MantisLog.debug("New video is already in state " + mediaElement.readyState,"yellow","black");
					this._syncObjs.set(media,duration);
					this._firstBuffered++;
					this._checkAutoplay();
				}else
				{
					media.play();
					this._buffering.set(media, duration);
					this._attachCanPlayListenerToVideo(media,duration);
				}
			}else this._syncObjs.set(media,duration);
			
			this._attachEndedListenerToVideo(media,duration)
				._attachBufferingListenerToVideo(media,duration)
				._attachBufferedListenerToVideo(media,duration);
		}	
	}

	protected _attachCanPlayListenerToVideo(media: VideoWrapper, duration: number): this
	{
		const listenersMap = this._listeners.get(media);
		if (listenersMap && !listenersMap.has("canplay"))
		{
			const firstDataBufferedOnVideo = () =>
			{
				MantisLog.debug("Video first buffering is finished","yellow","black");
				const listenersMap = this._listeners.get(media);
				if (listenersMap)
				{
					listenersMap.delete("canplay");
					media.getMediaElement()?.removeEventListener("canplay",firstDataBufferedOnVideo);

					if (this._currentTimestamp > duration)
					{
						this._ended.set(media,duration);
					}else
					{
						this._syncObjs.set(media,duration);
					}
	
					this._buffering.delete(media);

					if (this._firstStart)
					{
						this._firstBuffered++;
					}else if (this._buffering.size === 0)
					{
						this._playLib();
						if (!this.isPaused()) this._playUser();
					}
					this._checkAutoplay();
					if (this._firstStart) media.pause(); //if the first start hasn't been triggered yet, the video should pause
				}
			};
			listenersMap.set("canplay",firstDataBufferedOnVideo);
			media.getMediaElement()?.addEventListener("canplay",firstDataBufferedOnVideo);
			MantisLog.debug("Video first buffering listener attached. Current state is: " + media.getMediaElement()?.readyState,"yellow","black");
		}else throw "Attempt to attach second listener to ended";
		return this;
	}

	protected _attachEndedListenerToVideo(media: VideoWrapper, duration: number): this
	{
		const listenersMap = this._listeners.get(media);
		if (listenersMap && !listenersMap.has("ended"))
		{
			const callback = () => 
			{
				this._videoHasEnded(media, duration);
			};
			listenersMap.set("ended",callback);
			media.getMediaElement()?.addEventListener("ended",callback);
		}else throw "Attempt to attach second listener to ended";
		return this;
	}

	protected _attachBufferingListenerToVideo(media: VideoWrapper, duration: number): this
	{
		const listenersMap = this._listeners.get(media);
		if (listenersMap && !listenersMap.has("buffering"))
		{
			const callback = () => 
			{
				if (!this._firstStart)
				{
					if (!this._ended.has(media))
					{
						this._pauseLib();
						this._buffering.set(media,duration);
						this._syncObjs.delete(media);
					}
				}
			};
			listenersMap.set("buffering",callback);
			media.getMediaElement()?.addEventListener("waiting",callback);
		}else throw "Attempt to attach second listener to waiting";
		return this;
	}

	protected _attachBufferedListenerToVideo(media: VideoWrapper, duration: number): this
	{
		const listenersMap = this._listeners.get(media);
		if (listenersMap && !listenersMap.has("buffered"))
		{
			const callback = () => 
			{
				if (!this._firstStart)
				{
					if (this._currentTimestamp > duration)
					{
						this._ended.set(media,duration);
					}else
					{
						this._syncObjs.set(media,duration);
					}

					this._buffering.delete(media);
					if (this._buffering.size === 0)
					{
						this._playLib();
						if (!this.isPaused()) this._playUser();
					}else if (this._userStatePlay === -1 || this._libStatePlay === -1)
					{
						media.pause();
					}
				}
			};
			listenersMap.set("buffered",callback);
			media.getMediaElement()?.addEventListener("canplay",callback);
		}else throw "Attempt to attach second listener to playing";
		return this;
	}

	/**
	 * This method is called on the last video from all under this object which has ended
	 * @param media video (or SYK) which has just ended
	 * @param duration duration of said video
	 */
	protected async _lastVideoHasEnded(media: SynchronizableObject, duration: number)
	{
		this._buffering.forEach((duration,media) => 
		{
			this._syncObjs.set(media,duration);
		});
		this._buffering.clear();
		
		this._ended.forEach((endedDuration,endedMedia) => 
			{
				if (this._looping.has(endedMedia) || this._looping.size === 0) 
				{//all the ended videos which should loop should move to sync objects. Same goes if no video loops so it can manulally triggered
					this._syncObjs.set(endedMedia,endedDuration);
					this._ended.delete(endedMedia);
				}
			});

		await this._pauseLib();
		this._currentTimestamp = 0;
		this._pausedTimestamp = 0;
		this._loopVideos();
				
		this._callCallbacks("timeupdate",0);
					
		if (this._looping.has(media))
		{
			if (this._timingObject)
			{
				this._timingObject.update({ position: 0, velocity: 1 });
				this._timingObject.on("timeupdate",this._timeupdate);
			}
		}else
		{//since this renderer might not be set to loop, we must look for a different potential element to loop
			if (this._looping.size > 0)
			{
				this._syncObjs.delete(media);
				this._ended.set(media, duration);
				this._lookForLongestAfterLoop();
				if (this._timingObject)
				{
					this._timingObject.update({ position: 0, velocity: 1 });
					this._timingObject.on("timeupdate",this._timeupdate);
				}
			}else
			{
				this._timingObject = null;
				await this.pause(); 
			}
		}
		await this._playLib();
	}

	protected async _videoHasEnded(media: SynchronizableObject, duration: number)
	{
		if (this._syncObjs.size === 1)
		{//this is the last video which has reached its end
			await this._lastVideoHasEnded(media,duration);
		}else
		{
			this._ended.set(media,duration);
			this._syncObjs.delete(media)
			this._buffering.delete(media);
		}
	}
	
	/**
	 * If a users wants to start playing the video, this method should be called. However, the video won't be
	 * played if pauseLib() was called before. Only if both, libraries and the user, wish to play the video, the video
	 * actually starts to play.
	 */
	protected async _playUser()
	{
		MantisLog.debug("playUser userstate: " + this._userStatePlay + " libstate: " + this._libStatePlay,"pink","black");
		if (this._promise)
		{//someone already asked the video to be played
			this._userStatePlay = 0;
			//this.libStatePlay = 0;
			try
			{
				await this._promise;
				this._promise = null;
				if (this._libStatePlay !== -1 && this._userStatePlay !== -1)
				{//check if someone hasn't required for the video to pasue in the meantime
					this._userStatePlay = 1
					this._libStatePlay = 1;
				}
				return;
			}catch (err)
			{
				this._promise = null;
				this._userStatePlay = -1
				throw err;
			}
		}else if (this._libStatePlay > -1 && this._userStatePlay > -1) 
		{//either the video is already playing or someone waits for it to be played
			this._userStatePlay = 1;
			this._libStatePlay = 1;
			this._promise = this._playAll();
			try
			{
				await this._promise;
				this._promise = null;
				if (this._libStatePlay !== -1 && this._userStatePlay !== -1)
				{//check if someone hasn't required for the video to pasue in the meantime
					this._userStatePlay = 1
					this._libStatePlay = 1;
				}
			}catch (err)
			{
				this._promise = null;
				throw err;
			}
			return;
		}else if (this._libStatePlay === -1)
		{//video was internally paused -- we just mark that user wants to play it
			this._userStatePlay = 0;
			return;
		}else if (this._userStatePlay === -1)
		{//video is paused by the user, but the library want it to be played
			this._userStatePlay = 0;
			this._promise = this._playAll();
			try
			{
				await this._promise;
				this._promise = null;
				if (this._libStatePlay !== -1 && this._userStatePlay !== -1)
				{//check if someone hasn't required for the video to pasue in the meantime
					this._userStatePlay = 1
					this._libStatePlay = 1;
				}
				return;
			}catch (err)
			{
				this._promise = null;
				this._userStatePlay = -1
				throw err;
			}
		}else
		{
			throw "Unknown state";
		}
	}
	
	/**
	 * User who requests to pause the video should call this method. Pause has a higher priority than any play, so the
	 * video is paused even if no library has requested it.
	 */
	protected async _pauseUser()
	{
		MantisLog.debug("pauseUser userstate: " + this._userStatePlay + " libstate: " + this._libStatePlay,"pink","black");
		this._userStatePlay = -1;
		if (this._promise)
		{
			try
			{
				await this._promise;
				this._promise = null;
				if (this._userStatePlay === -1)
				{//pause it only if the user doesn't want to play it in the meantime
					await this._pauseAll();
				}
			}catch (err)
			{
				this._promise = null;
			}
			return;
		}else
		{//don't need to wait for the promise -- simply puase it
			await this._pauseAll();
		}
	}
	
	/**
	 * A library which uses VideoElement object and wants to play the video should call this method. However, the video won't be
	 * played if pauseUser() was called before. Only if both, libraries and the user, wish to play the video, the video
	 * actually starts to play.
	 */
	protected async _playLib()
	{
		MantisLog.debug("playLib userstate: " + this._userStatePlay + " libstate: " + this._libStatePlay,"pink","black");
		if (this._promise)
		{//someone already asked the video to be played
			//this.userStatePlay = 0;
			this._libStatePlay = 0;
			try
			{
				await this._promise;
				this._promise = null;
				if (this._libStatePlay !== -1 && this._userStatePlay !== -1)
				{//check if someone hasn't required for the video to pasue in the meantime
					this._userStatePlay = 1
					this._libStatePlay = 1;
				}
				return;
			}catch (err)
			{
				this._promise = null;
				this._libStatePlay = -1
				throw err;
			}
		}else if (this._libStatePlay > -1 && this._userStatePlay > -1) 
		{//either the video is already playing or someone waits for it to be played
			this._userStatePlay = 1;
			this._libStatePlay = 1;
			this._promise = this._playAll();
			try
			{
				await this._promise;
				this._promise = null;
				if (this._libStatePlay !== -1 && this._userStatePlay !== -1)
				{//check if someone hasn't required for the video to pasue in the meantime
					this._userStatePlay = 1
					this._libStatePlay = 1;
				}
			}catch (err)
			{
				this._promise = null;
				throw err;
			}
			return;
		}else if (this._userStatePlay === -1)
		{//user doesn't want the video to be played
			this._libStatePlay = 0;
			return;
		}else if (this._libStatePlay === -1)
		{//video is paused by the library, but the user want it to be played
			this._libStatePlay = 0;
			this._promise = this._playAll();
			try
			{
				await this._promise;
				this._promise = null;
				if (this._libStatePlay !== -1 && this._userStatePlay !== -1)
				{//check if someone hasn't required for the video to pasue in the meantime
					this._userStatePlay = 1
					this._libStatePlay = 1;
				}
				return;
			}catch (err)
			{
				this._promise = null;
				this._libStatePlay = -1
				throw err;
			}
		}else
		{
			throw "Unknown state";
		}
	}
	
	/**
	 * Library which requests to pause the video should call this method. Pause has a higher priority than any play, so the
	 * video is paused even if no user has requested it.
	 */
	protected async _pauseLib()
	{
		MantisLog.debug("pauseLib userstate: " + this._userStatePlay + " libstate: " + this._libStatePlay,"pink","black");
		this._libStatePlay = -1;
		if (this._promise)
		{
			try
			{
				await this._promise;
				this._promise = null;
				if (this._libStatePlay === -1)
				{//pause it only if the library doesn't want to play it in the meantime
					await this._pauseAll();
				}
			}catch (err)
			{
				this._promise = null;
			}
			return;
		}else
		{//don't need to wait for the promise -- simply puase it
			await this._pauseAll();
		}
	}
	
	protected async _playAll()
	{
		if (this._syncObjs.size > 0)
		{
			if (this._timingObject === null)
			{
				MantisLog.debug("PLAY ALL " + this._syncObjs.size + " media for the first time","yellow","black");
				this._timingObject = new this._timingClass({ vector: 
					{
						position: this._currentTimestamp,
						velocity: 1.0
					}});

				this._timingObject.on("timeupdate",this._timeupdate);
			}else if (this._pausedTimestamp > 0)
			{
				MantisLog.debug("PLAY ALL " + this._syncObjs.size + " media after pause, Paused timestamp was: " + this._pausedTimestamp,"yellow","black");
				this._timingObject.update({ position: this._pausedTimestamp, velocity: 1 });
				this._pausedTimestamp = 0;
				this._timingObject.on("timeupdate",this._timeupdate);
			}else MantisLog.debug("PLAY ALL " + this._syncObjs.size + " media","yellow","black");

			const iter = this._syncObjs.entries();
			let media: [SynchronizableObject,number];
			while (media = iter.next().value)
			{
				media[0].play();
			}
			MantisLog.debug("PLAY ALL FINISHED","yellow","black");
		}
	}
	
	protected async _pauseAll()
	{
		MantisLog.debug("PAUSE ALL","yellow","black");
		if (this._timingObject && this._pausedTimestamp === 0)
		{
			this._pausedTimestamp = this._timingObject.query().position;
			this._timingObject.off("timeupdate",this._timeupdate);
		}
		const promises: Promise<void>[] = [];
		this._syncObjs.forEach((duration,media) =>
		{
			promises.push(media.pause());
		});
		this._ended.forEach((duration,media) =>
		{
			promises.push(media.pause());
		});
		await Promise.allSettled(promises);
	}
	
	protected _callCallbacks(event: "timeupdate"|"durationchange", data: number)
	{
		const callbacks = this._callbacks.get(event);
		if (callbacks)
		{
			const iter = callbacks.values();
			let callback;
			while (callback = iter.next().value)
			{
				callback(data);
			}
		}
	}
}
