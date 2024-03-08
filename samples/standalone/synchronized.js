import * as three from "https://unpkg.com/three@0.160.0";
import { TimingObject } from "./timingsrc.js";
import "./MantisSynchronizer.min.js";
// Import of three.js must take place prior to the MantisRYSK.min.js because RYSK library relies on the global
// variable THREE to be already registered present

const synchronizer = new window.RyskSynchronizer(TimingObject);

const chloe_video = "./chloe_battle.mp4";
const chloe_data = "./chloe_battle.syk";
const rob_video = "./rob.mp4";
const rob_data = "./rob.syk";

document.addEventListener('DOMContentLoaded',function()
{
	import("./MantisRYSK.min.js").then(() => 
	{
		Rysk.MantisLog.SetLogLevel(Rysk.MantisLog.WARNINGS | Rysk.MantisLog.ERRORS);
		const viewport = document.getElementById("viewport");
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
	});
});


/**
 * Creates a renderer so the scene could be displayed
 * @param {Integer} width requested width of the rendering window
 * @param {Integer} height requested height of the rendering window
 * @returns {THREE.WebGLRenderer|createRenderer.renderer} created renderer
 */
function createRenderer(width,height)
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
function run(renderer,scene,camera)
{
	const chloeRYSK = new Rysk.RYSKUrl(chloe_video, chloe_data, 25, THREE.SRGBColorSpace);
	const robRYSK = new Rysk.RYSKUrl(rob_video, rob_data, 25, THREE.SRGBColorSpace);
	chloeRYSK.setPreviewMode(true);
	robRYSK.setPreviewMode(true);
	synchronizer.addMedia([chloeRYSK, robRYSK]).then(() => synchronizer.setLoop([chloeRYSK, robRYSK], true));
	synchronizer.setVolume(1);

	const progress = document.getElementById("progress");
	
	progress.addEventListener("click", event => 
	{
		const duration = synchronizer.getDuration();
		if (duration > 0)
		{
			const pos = (event.pageX - progress.offsetLeft - progress.offsetParent.offsetLeft) / progress.offsetWidth;
			synchronizer.jumpAt(pos * duration);
		}
	});
	
	synchronizer.on("durationchange",newduration =>
	{
		if (newduration)
		{
			progress.setAttribute("max", newduration.toString());
		}
	});
	synchronizer.on("timeupdate",newtime => progress.value = newtime);
	
	chloeRYSK.run().then(mesh =>
	{//add mesh to the scene
		mesh.position.set(-1,0,0);
		mesh.visible = true;
		scene.add(mesh);
	});

	robRYSK.run().then(mesh =>
	{//add mesh to the scene
		mesh.position.set(1,0,0);
		mesh.visible = true;
		scene.add(mesh);
	});
	
	document.getElementById("play").addEventListener("click",event =>
	{//event listener for the button which plays/pauses the animation
		if (synchronizer.isPaused())
		{
			console.log("Playing");
			synchronizer.play();
			event.target.innerHTML = "Pause";
		}else
		{
			console.log("Pausing");
			synchronizer.pause();
			event.target.innerHTML = "Play";
		}
	});

	document.getElementById("playbackrate").addEventListener("change", event =>
	{
		if (synchronizer !== null)
		{
			synchronizer.setPlaybackRate(parseFloat(event.target.value));
		}
	});
	
	renderer.setAnimationLoop((timestamp, frame) => 
	{//animation loop to render each frame-
		if (chloeRYSK !== null)
		{
			chloeRYSK.update();
		}
		if (robRYSK !== null)
		{
			robRYSK.update();
		}
		renderer.clear(true, true, true);
		renderer.render(scene, camera);
	});
}
