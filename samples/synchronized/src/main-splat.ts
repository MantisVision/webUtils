import * as THREE from "three";
import { MantisLog } from "@mantisvision/utils";
import { SplatMesh, SPACKUrl } from "@mantisvision/rysksplat";

import * as TIMINGSRC from "./timingsrc.js";
import VideoSync, { TimingObject, VideoSyncEvents } from "@mantisvision/synchronizer";

const splinteraudio_url = "https://prg-syk-uploads.s3.us-east-1.amazonaws.com/robo/2025_10_09_david_phillips_pitch_09_phillips_pitch_09_50k_splinter.m4a";
const splinterdata_url = "https://prg-syk-uploads.s3.us-east-1.amazonaws.com/robo/2025_10_09_david_phillips_pitch_09_phillips_pitch_09_50k_splinter.splinter";
const spackvideo_url = "https://prg-syk-uploads.s3.us-east-1.amazonaws.com/ElfLabs/2025-10-09_david_phillips_pitch_09-dp_spack_50k_spack.mp4";
const spackdata_url = "https://prg-syk-uploads.s3.us-east-1.amazonaws.com/ElfLabs/2025-10-09_david_phillips_pitch_09-dp_spack_50k_spack.spack";

const synchronizer = new VideoSync(<TimingObject>(<any>TIMINGSRC).TimingObject);
synchronizer.setAutoplay(false);
synchronizer.setVolume(1);

document.addEventListener('DOMContentLoaded',function()
{
	MantisLog.SetLogLevel(MantisLog.ERRORS | MantisLog.WARNINGS);
	const viewport = document.getElementById("viewport");
	if (viewport)
	{
		const scene = new THREE.Scene();
		const renderer = createRenderer(viewport.offsetWidth,viewport.offsetHeight);
		
		// three.js camera is created and inserted into the scene
		const cameraRigY = new THREE.Group();
		const cameraRigX = new THREE.Group();
		cameraRigY.add(cameraRigX);
		scene.add(cameraRigY);
		
		const camera = new THREE.PerspectiveCamera(70, viewport.offsetWidth / viewport.offsetHeight, 0.01, 20);
		camera.position.set(0, 1.5, 2.2);
		camera.lookAt(0, 1.0, 0);
		cameraRigY.add(camera);
		
		viewport.appendChild(renderer.domElement);
		run(renderer,scene,camera);
	}
});

/**
 * Creates a renderer so the scene could be displayed
 * @param {Integer} width requested width of the rendering window
 * @param {Integer} height requested height of the rendering window
 * @returns {THREE.WebGLRenderer|createRenderer.renderer} created renderer
 */
function createRenderer(width: number, height: number)
{
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(window.devicePixelRatio);
		
	renderer.setSize(width,height);
	renderer.setClearColor(0xFFFFFF, 1);
	renderer.autoClear = false;
	return renderer;
}

/**
 * Runs the whole animation
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.PerspectiveCamera} camera
 * @returns {undefined}
 */
function run(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera)
{
	let res1:  (value: any) => void;
	const promise1 = new Promise<SPACKUrl>((resolve, reject) => 
	{
		res1 = resolve;
	});

	const splinterMesh = new SplatMesh({
		mediaurl: splinteraudio_url,
		dataurl: splinterdata_url,
		loop: true,
		renderer,
		autoinit: {
			onError: console.error,
			onSuccess(splatRYSK)
			{
				splinterMesh.position.set(1,0,0);
				splinterMesh.rotateY(Math.PI);
				splinterMesh.visible = true;
				splinterMesh.setVolume(1);
				scene.add(splinterMesh);
				res1(splatRYSK);
			}
		}
	});

	let res2: (value: any) => void;
	const promise2 = new Promise<SPACKUrl>((resolve, reject) => 
	{
		res2 = resolve;
	});

	const spackMesh = new SplatMesh({
		mediaurl: spackvideo_url,
		dataurl: spackdata_url,
		loop: true,
		renderer,
		autoinit: {
			onError: console.error,
			onSuccess(splatRYSK)
			{
				spackMesh.position.set(-1,0,0);
				spackMesh.rotateY(Math.PI);
				spackMesh.visible = true;
				spackMesh.setVolume(1);
				scene.add(spackMesh);
				res2(splatRYSK);
			}
		}
	});
	

	Promise.allSettled([promise1, promise2]).then(results => 
	{
		const ryskObjs: SPACKUrl[] = [];
		for (const res of results)
		{
			if (res.status === "fulfilled" && res.value !== null)
			{
				ryskObjs.push(res.value);
			}
		}
		if (ryskObjs.length > 0)
		{
			synchronizer.addMedia(ryskObjs).then(() => synchronizer.setLoop(ryskObjs, true));
		}
	});
	
	const progress = document.getElementById("progress") as HTMLProgressElement;
	
	progress.addEventListener("click", event => 
	{
		const duration = synchronizer.getDuration();
		if (duration > 0)
		{
			const pos = (event.pageX - progress.offsetLeft - (<HTMLDivElement>(progress.offsetParent)).offsetLeft) / progress.offsetWidth;
			synchronizer.jumpAt(pos * duration);
		}
	});
	
	synchronizer.on(VideoSyncEvents.durationchange,newduration => 
	{
		if (newduration)
		{
			progress.setAttribute("max", newduration.toString());
		}
	});
	
	synchronizer.on(VideoSyncEvents.timeupdate,newtime =>
 	{
		if (newtime) progress.value = newtime;
	});

	synchronizer.on(VideoSyncEvents.buffered, () => MantisLog.debug("VideoSync is buffered", "aqua", "purple"))
	
	
	document.getElementById("play")?.addEventListener("click",event =>
	{//event listener for the button which plays/pauses the animation
		if (event.target)
		{
			if (synchronizer.isPaused())
			{
				console.log("Playing");
				synchronizer.play();
				(event.target as HTMLButtonElement).innerHTML = "Pause";
			}else
			{
				console.log("Pausing");
				synchronizer.pause();
				(event.target as HTMLButtonElement).innerHTML = "Play";
			}
		}
	});

	document.getElementById("playbackrate")?.addEventListener("change", event =>
	{
		const value = (<HTMLInputElement>event.target).value;
		if (synchronizer !== null && value)
		{
			synchronizer.setPlaybackRate(parseFloat(value));
		}
	});
	
	renderer.setAnimationLoop((timestamp, frame) => 
	{//animation loop to render each frame-
		//if (chloeRYSK !== null) chloeRYSK.update();
		if (spackMesh !== null)
		{
			spackMesh.update(camera);
			spackMesh.renderTextureOverlay(renderer, false);
		}
		if (splinterMesh !== null)
		{
			splinterMesh.update(camera);
			splinterMesh.renderTextureOverlay(renderer, false);
		}
		
		renderer.clear(true, true, true);
		renderer.render(scene, camera);
	});
}
