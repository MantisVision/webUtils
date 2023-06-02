import { MantisLog } from "@mantisvision/utils";
import { SynchronizableObject } from "./Types";

enum eVideoStatus {
	paused,
	playing,
}

export default class VideoWrapper implements SynchronizableObject
{
	#videoElem: HTMLVideoElement;
	#durationPromise: PromiseLike<number>;
	#durationResolve?: (value :number|PromiseLike<number>) => void;
	#volume: number = 1;
	#status: eVideoStatus = eVideoStatus.paused;
	#forcedPauseCallbacks: (()=>void)[] = [];
	#onDestroyCallbacks: ((data:any) => void)[] = [];
	#loop: boolean = false;
	#private_loopVideoThis = this.loopVideo.bind(this);
	#private_checkForcedPauseThis = this.private_checkForcedPause.bind(this);

	#playPromise: Promise<void>|null = null;

	constructor(videoElem: HTMLVideoElement)
	{
		this.#videoElem = videoElem;

		const eventName = "requestVideoFrameCallback" in HTMLVideoElement.prototype ? "loadedmetadata" : "loadeddata";
		this.#durationPromise = new Promise<number>((resolve,reject) =>
		{
			this.#durationResolve = resolve;
		});
		this.#videoElem?.addEventListener("canplay",() => MantisLog.debug("Canplay was fired","purple"));
		this.#videoElem?.addEventListener("waiting",() => MantisLog.debug("Waiting was fired","purple"));
		this.#videoElem?.addEventListener(eventName,() =>
		{
			MantisLog.debug(eventName + " was fired","purple");
			if (this.#durationResolve && this.#videoElem) this.#durationResolve(this.#videoElem.duration);
		});
	}

	getMediaElement(): HTMLVideoElement|null
	{
		return this.#videoElem;
	}

	setVolume(level: number)
	{
		if (level !== this.#volume && this.#videoElem)
		{
			this.#volume = level;
			this.#videoElem.volume = level;
			this.#videoElem.muted = level <= 0;
		}
	}

	async play()
	{
		if (this.#videoElem)
		{
			this.#status = eVideoStatus.playing;
			
			await this.#durationPromise;

			if (this.#status === eVideoStatus.playing && this.#playPromise === null && this.#videoElem)
			{
				this.#videoElem.volume = 0;
				this.#videoElem.muted = true;
				this.#playPromise = this.#videoElem.play();
				await this.#playPromise;
				this.private_IOSFix();
				this.#playPromise = null;
			}
		}
	}

	async pause()
	{
		if (this.#videoElem && this.#status === eVideoStatus.playing)
		{
			this.#status = eVideoStatus.paused;
			if (this.#playPromise) await this.#playPromise;
			if (this.#status === eVideoStatus.paused && this.#videoElem)
			{
				this.#videoElem.pause();
			}
		}
	}

	jumpAt(timestamp: number)
	{
		if (this.#videoElem)
		{
			this.#videoElem.volume = 0;
			this.#videoElem.muted = true;
			this.#videoElem.currentTime = timestamp;
			this.private_IOSFix();
		}
		return this;
	}

	/**
	 * This event is called when the RYSKUrl object gets disposed.
	 * @type type
	 */
	onDestroy(callback: (data:any) => void)
	{
		this.#onDestroyCallbacks.push(callback);
		return this;
	}

	/**
	 * Attach event listener which gets periodically triggered as the currentTime of video changes
	 * @type type
	 */
	onTimeUpdate(callback: (event: Event) => void)
	{
		if (this.#videoElem)
		{
			this.#videoElem.addEventListener("timeupdate",callback);
		}
		return this;
	}

	/**
	 * Detach event listener from timeupdate of the RYSK/SYK video
	 * @type type
	 */
	offTimeUpdate(callback: (event: Event) => void)
	{
		if (this.#videoElem)
		{
			this.#videoElem.removeEventListener("timeupdate",callback);
		}
		return this;
	}

	async stop()
	{
		this.#status = eVideoStatus.paused;
		if (this.#videoElem)
		{
			await this.#videoElem.pause();
			this.#videoElem.currentTime = 0;
		}
	}

	async getDuration()
	{
		return await this.#durationPromise;
	}

	/**
	 * Gets current time in the played video.
	 * @returns {Fload} current time
	 */
	getCurrentTime()
	{
		return this.#videoElem ? this.#videoElem.currentTime : 0;
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
		this.#loop = loop;
		if (loop)
		{
			this.#videoElem.addEventListener("ended",this.#private_loopVideoThis);
		}else
		{
			this.#videoElem.removeEventListener("ended",this.#private_loopVideoThis);
		}
	}

	get loop()
	{
		return this.#loop;
	}

	set playbackRate(rate: number)
	{
		this.#videoElem.playbackRate = rate;
	}

	get playbackRate(): number
	{
		return this.#videoElem ? this.#videoElem.playbackRate : 0;
	}

	finish(): void
	{
		this.#videoElem.removeEventListener("pause",this.#private_checkForcedPauseThis);
		this.#videoElem.removeEventListener("ended",this.#private_loopVideoThis);

		for (var callback of this.#onDestroyCallbacks)
		{
			callback(undefined);
		}
		this.#onDestroyCallbacks = [];
		this.#forcedPauseCallbacks = [];
	}

	private_IOSFix()
	{
		setTimeout(() =>
		{
			if (this.#videoElem)
			{
				this.#videoElem.addEventListener("pause",this.#private_checkForcedPauseThis);
				setTimeout(() =>
				{//unregister listener
					if (this.#videoElem) this.#videoElem.removeEventListener("pause",this.#private_checkForcedPauseThis);
				},1000);
				this.#videoElem.volume = this.#volume;
				this.#videoElem.muted = this.#volume <= 0;
			}
		},250);
	}

	/**
	 * This function ensures the video element loops
	 */
	loopVideo()
	{
		if (this.#videoElem)
		{
			this.#status = eVideoStatus.playing;
			this.#videoElem.volume = 0;
			this.#videoElem.muted = true;
			this.#videoElem.play().then(this.private_IOSFix.bind(this));
		}
	}

	/**
	 * This is an attempt to solve the issue with an autopause which may happen on IOS phones.
	 */
	private_checkForcedPause()
	{
		if (this.#videoElem && this.#status === eVideoStatus.playing)
		{
			this.#videoElem.removeEventListener("pause",this.#private_checkForcedPauseThis);
			for (var callback of this.#forcedPauseCallbacks)
			{
				callback();
			}
		}
	}
}