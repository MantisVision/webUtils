
export type CallbackType = "timeupdate"|"buffering"|"buffered"|"ended"|"canplay";

export type RYSKSources = {
	video: string;
	data: string;
};

export interface SynchronizableObject
{
	play: () => Promise<void>;
	pause: () => Promise<void>;
	stop: () => Promise<void>;
	getMediaElement: () => HTMLMediaElement|null;
	getDuration: ()=> Promise<number|null>;
	jumpAt: (timestamp: number) => SynchronizableObject; 
	getCurrentTime: () => number;
	onTimeUpdate: (callback: (event: Event) => void) => SynchronizableObject;
	onDestroy: (callback: (data:any) => void) => SynchronizableObject;
	offTimeUpdate: (callback: (event: Event) => void) => SynchronizableObject;
	onForcedPause: (callback: ()=>void) => SynchronizableObject;
	offForcedPause: (callback: ()=>void) => SynchronizableObject;
	setVolume(level: number): void;
	loopVideo(): void;
	set loop(loop: boolean);
	get loop(): boolean;
	set playbackRate(rate: number);
	get playbackRate(): number;
}
