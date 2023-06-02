import RYSKUrl from "@mantisvision/ryskurl";
import { RyskEvents } from "@mantisvision/utils";
import { SynchronizableObject } from "./Types";

enum eSykStatus{
	paused,
	forcedPause,
	buffering,
	playing
};

export default class RYSKUrlWrapper implements SynchronizableObject
{
	#status: number = eSykStatus.paused;
	#volume: number = 1;
	#failed: boolean = false;
	#ryskUrl: RYSKUrl|null;
	#onErrorCallback: null|((error:any) => void) = null;
	#loop: boolean = false;
	#private_loopVideoThis = this.loopVideo.bind(this);
	#private_checkForcedPauseThis = this.private_checkForcedPause.bind(this);
	#forcedPauseCallbacks: (()=>void)[] = [];
	#playPromise: (()=>void)|null = null;

	/**
	 * 
	 * @param {String} videoUrl source video element which is streaming a file
	 * @param {type} hostName
	 * @param {type} position
	 * @param {type} rotation
	 * @param {type} scale
	 */
	constructor(ryskUrl: RYSKUrl)
	{		
		this.#ryskUrl = ryskUrl;
		this.#ryskUrl.loop = false;
		
		this.#ryskUrl.on(RyskEvents.error,error =>
		{
			this.#failed = error;
			if (this.#onErrorCallback)
			{
				this.#onErrorCallback(error);
			}
		});
		
		this.#ryskUrl.on(RyskEvents.buffering, () => this.#status = eSykStatus.buffering);
		this.#ryskUrl.on(RyskEvents.buffered, () => 
		{
			if (this.#status !== eSykStatus.paused && this.#status !== eSykStatus.forcedPause)
			{
				this.#status = eSykStatus.playing;
			}
		});
	}
	
	getMediaElement()
	{
		var result = null;
		if (this.#ryskUrl)
		{
			result = this.#ryskUrl.getVideoElement();
		}
		return result;
	}

	/**
	 * Returns a reference to the RYSK object behind
	 * @returns 
	 */
	getRYSKObject()
	{
		return this.#ryskUrl;
	}
	
	async getDuration()
	{
		if (this.#ryskUrl) return await this.#ryskUrl.getDuration();
		else return null;
	}
	
	/**
	 * Jumps at a specific timestamp in the video.
	 * @type type
	 */
	jumpAt(timestamp: number)
	{
		if (this.#ryskUrl) 
		{
			this.#ryskUrl.setVolume(0);
			this.#ryskUrl.jumpAt(timestamp).then(() =>
			{
				this.private_IOSFix();
			});
		}
		return this;
	}
	
	/**
	 * Gets current time in the played video.
	 * @returns {Fload} current time
	 */
	getCurrentTime()
	{
		var time = 0;
		if (this.#ryskUrl)
		{
			const elem = this.#ryskUrl.getVideoElement();
			if (elem) time = elem.currentTime;
		}
		return time;
	}
	
	/**
	 * Attach event listener which gets periodically triggered as the currentTime of video changes
	 * @type type
	 */
	onTimeUpdate(callback: (event: Event) => void)
	{
		if (this.#ryskUrl)
		{
			this.#ryskUrl.onVideoEvent("timeupdate",callback);
		}
		return this;
	}
	
	/**
	 * Detach event listener from timeupdate of the RYSK/SYK video
	 * @type type
	 */
	offTimeUpdate(callback: (event: Event) => void)
	{
		if (this.#ryskUrl)
		{
			this.#ryskUrl.offVideoEvent("timeupdate",callback);
		}
		return this;
	}
	
	/**
	 * This event is called when the RYSKUrl object gets disposed.
	 * @type type
	 */
	onDestroy(callback: (data:any) => void)
	{
		if (this.#ryskUrl)
		{
			this.#ryskUrl.on(RyskEvents.disposed,callback);
		}
		return this;
	}
	
	/**
	 * Callback which shall be triggered when a video is forcibelly paused
	 * @param {type} callback
	 * @returns {unresolved}
	 */
	onForcedPause(callback: ()=>void)
	{
		this.#forcedPauseCallbacks.push(callback);
		return this;
	}
	
	offForcedPause(callback: ()=>void)
	{
		for (var i = 0; i < this.#forcedPauseCallbacks.length; i++)
		{
			if (this.#forcedPauseCallbacks[i] === callback)
			{
				this.#forcedPauseCallbacks.splice(i,1);
				break;
			}
		}
		return this;
	}
	
	set loop(loop: boolean)
	{
		if (this.#ryskUrl !== null)
		{
			this.#loop = loop;
			if (loop)
			{
				this.#ryskUrl.onVideoEvent("ended",this.#private_loopVideoThis);
			}else 
			{
				this.#ryskUrl.offVideoEvent("ended",this.#private_loopVideoThis);
			}
		}
	}
	
	get loop()
	{
		return this.#loop;
	}

	set playbackRate(rate: number)
	{
		const mediaElem = this.getMediaElement();
		if (mediaElem) mediaElem.playbackRate = rate;
	}

	get playbackRate(): number
	{
		const mediaElem = this.getMediaElement();
		return mediaElem ? mediaElem.playbackRate : 0;
	}
		
	async play()
	{
		this.#status = eSykStatus.playing;

		if (this.#ryskUrl)
		{
			this.#ryskUrl.setVolume(0);
			await this.#ryskUrl.play();
		}
		this.private_IOSFix();
		
		if (this.#playPromise)
		{
			const resolve = this.#playPromise;
			this.#playPromise = null;
			resolve();
		}
	}
	
	async pause()
	{
		this.#status = eSykStatus.paused;
		if (this.#ryskUrl) await this.#ryskUrl.pause();
	}
	
	async stop()
	{
		this.#status = eSykStatus.paused;
		if (this.#ryskUrl) await this.#ryskUrl.stop();
	}
		
	/**
	 * Sets volume level of audio
	 * @param {Double} level new volueme leve. must be between 0 and 1
	 */
	setVolume(level: number)
	{
		if (level !== this.#volume)
		{
			this.#volume = level;
			if (this.#ryskUrl) this.#ryskUrl.setVolume(level);
		}
	}
		
	finish()
	{
		this.#forcedPauseCallbacks = [];
		
		if (this.#ryskUrl)
		{
			this.#ryskUrl.offVideoEvent("ended",this.#private_loopVideoThis);
			this.#ryskUrl.offVideoEvent("pause",this.#private_checkForcedPauseThis);
			this.#ryskUrl.pause();
			this.#ryskUrl = null;
		}
	}
	
	/**
	 * This function ensures the video element loops
	 */
	loopVideo()
	{
		if (this.#ryskUrl !== null)
		{
			this.#status = eSykStatus.paused;
			this.#ryskUrl.setVolume(0);
			this.#ryskUrl.play().then(this.private_IOSFix.bind(this));
		}
	}
	
	private_IOSFix()
	{
		setTimeout(() => 
		{
			if (this.#ryskUrl !== null)
			{
				this.#ryskUrl.onVideoEvent("pause",this.#private_checkForcedPauseThis);
				setTimeout(() => 
				{//unregister listener
					if (this.#ryskUrl !== null) this.#ryskUrl.offVideoEvent("pause",this.#private_checkForcedPauseThis);
				},250);
				this.#ryskUrl.setVolume(this.#volume);
			}
		},250);
	}
	
	private_checkForcedPause()
	{
		if (this.#ryskUrl !== null)
		{
			if (this.#status === eSykStatus.playing)
			{
				this.#ryskUrl.offVideoEvent("pause",this.#private_checkForcedPauseThis);
				for (var callback of this.#forcedPauseCallbacks)
				{
					callback();
				}
			}
		}
	}
}
