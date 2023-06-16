import * as THREE from "three";
import { URLMesh } from "@mantisvision/ryskthreejs";
import { MantisLog } from "@mantisvision/utils";

import * as TIMINGSRC from "./timingsrc.js";
import VideoSync, { TimingObject, VideoSyncEvents } from "@mantisvision/synchronizer";

const chloe_video = "./chloe_battle.mp4";
const chloe_data = "./chloe_battle.syk";
const rob_video = "./rob.mp4";
const rob_data = "./rob.syk";

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
	const chloeRYSK = new URLMesh(chloe_video, chloe_data, 50, THREE.SRGBColorSpace);
	const robRYSK = new URLMesh(rob_video, rob_data, 50, THREE.SRGBColorSpace);
	synchronizer.addMedia([chloeRYSK, robRYSK]).then(() => synchronizer.setLoop([chloeRYSK, robRYSK], true));
	
	//ryskObj.on("buffering",() => console.log("buffering"));
	//ryskObj.on("playing",() => console.log("playing"));
	
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
	
	chloeRYSK.run().then(mesh => 
	{//add mesh to the scene
		if (mesh)
		{
			mesh.position.set(-1,0,0);
			mesh.visible = true;
			scene.add(mesh);
		}
	});

	robRYSK.run().then(mesh => 
	{//add mesh to the scene
		if (mesh)
		{
			mesh.position.set(1,0,0);
			mesh.visible = true;
			scene.add(mesh);
		}
	});
	
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
	
	renderer.setAnimationLoop((timestamp, frame) => 
	{//animation loop to render each frame-
		if (chloeRYSK !== null) chloeRYSK.update();
		if (robRYSK !== null) robRYSK.update();
		
		renderer.clear(true, true, true);
		renderer.render(scene, camera);
	});
}
