import * as THREE from "three";
import { SplatMesh, OrbitControls } from "@mantisvision/splatthreejs";
import { MantisLog, RyskEvents } from "@mantisvision/utils";

const splinteraudio_url = "https://prg-syk-uploads.s3.us-east-1.amazonaws.com/robo/2025_10_09_david_phillips_pitch_09_phillips_pitch_09_50k_splinter.m4a";
const splinterdata_url = "https://prg-syk-uploads.s3.us-east-1.amazonaws.com/robo/2025_10_09_david_phillips_pitch_09_phillips_pitch_09_50k_splinter.splinter";
const spackvideo_url = "https://prg-syk-uploads.s3.us-east-1.amazonaws.com/ElfLabs/2025-10-09_david_phillips_pitch_09-dp_spack_50k_spack.mp4";
const spackdata_url = "https://prg-syk-uploads.s3.us-east-1.amazonaws.com/ElfLabs/2025-10-09_david_phillips_pitch_09-dp_spack_50k_spack.spack";

let _renderer;
let _controls;

document.addEventListener('DOMContentLoaded',function()
{
	MantisLog.SetLogLevel(MantisLog.ERRORS | MantisLog.WARNINGS);
	const viewport = document.getElementById("viewport");
	const scene = new THREE.Scene();
	const renderer = createRenderer(viewport.offsetWidth,viewport.offsetHeight);
	
	// three.js camera is created and inserted into the scene
	const cameraRigY = new THREE.Group();
	const cameraRigX = new THREE.Group();
	cameraRigY.add(cameraRigX);
	scene.add(cameraRigY);
	
	const camera = new THREE.PerspectiveCamera(70, viewport.offsetWidth / viewport.offsetHeight, 0.01, 100);
	camera.position.set(2, 1, 0);
	camera.lookAt(0, 0.8, 0);
	cameraRigY.add(camera);

	let resizeObserver = new ResizeObserver(() => {
		renderer.setSize(viewport.offsetWidth, viewport.offsetHeight);
		// this.forceRenderNextFrame();
	});
	resizeObserver.observe(viewport);
	
	viewport.appendChild(renderer.domElement);

	_renderer = renderer;
	_controls = setupControls(camera, renderer, new THREE.Vector3(0, 0.8, 0));

	run(renderer,scene,camera);
});

/**
 * Creates a renderer so the scene could be displayed
 * @param {Integer} width requested width of the rendering window
 * @param {Integer} height requested height of the rendering window
 * @returns {THREE.WebGLRenderer|createRenderer.renderer} created renderer
 */
function createRenderer(width,height)
{
	const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, precision: 'highp'});
	renderer.setPixelRatio(window.devicePixelRatio);
		
	renderer.setSize(width,height);
	renderer.setClearColor(0x696969);
	renderer.autoClear = true;

	//this.renderer.setPixelRatio(this.devicePixelRatio);
	return renderer;
}

/**
 * 
 * @param {THREE.Camera} camera 
 * @param {THREE.WebGLRenderer} renderer 
 * @param {THREE.Vector3} initialCameraLookAt 
 * @returns 
 */
function setupControls(camera, renderer, initialCameraLookAt)
{
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.listenToKeyEvents(window);
	controls.rotateSpeed = 0.5;
	controls.maxPolarAngle = Math.PI * .75;
	controls.minPolarAngle = 0.1;
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.target.copy(initialCameraLookAt);
	controls.update();

	return controls;
}

/**
 *  
 * @param {THREE.Scene} scene 
 */
function addPlane(scene)
{
	const geometry = new THREE.PlaneGeometry(1, 1);
	const material = new THREE.MeshStandardMaterial({ color: 0x2c3e50 }); // dark gray-blue
	const plane = new THREE.Mesh(geometry, material);
	plane.rotation.x = -Math.PI / 2; // face up (XZ plane)
	plane.position.set(0, 0, 0);
	scene.add(plane);
}

/**
 *  
 * @param {THREE.Scene} scene 
 */
function addLight(scene)
{
	const light = new THREE.DirectionalLight(0xffffff, 1); // white light, full intensity
	light.position.set(5, 10, 7.5); // position the light above and angled
	scene.add(light);
}

/**
 * Runs the whole animation
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.PerspectiveCamera} camera
 * @returns {undefined}
 */
async function run(renderer,scene,camera)
{
	addLight(scene);
	addPlane(scene);
	
	const urlParams = new URLSearchParams(window.location.search);
	const type = urlParams.get('type');
	const media_url = type && type === "splinter" ? splinteraudio_url : spackvideo_url;
	const data_url = type && type === "splinter" ? splinterdata_url : spackdata_url;

	document.getElementById(type ?? "spack").style.display = "none";

	const splatMesh = new SplatMesh({
		renderer: renderer,
		mediaurl: media_url,
		dataurl: data_url,
		loop: true,
		autoinit: {
			onError: console.error,
			onSuccess()
			{
				splatMesh.setVolume(1);
				scene.add(splatMesh);
			}
		}
	});
	
	const progress = document.getElementById("progress");
	
	progress.addEventListener("click", event => 
	{
		const pos = (event.pageX - progress.offsetLeft - progress.offsetParent.offsetLeft) / progress.offsetWidth;
		splatMesh.getDuration().then(duration => splatMesh.jumpAt(pos * duration));
	});
	
	document.getElementById("play").addEventListener("click",event =>
	{//event listener for the button which plays/pauses the animation
		if (splatMesh !== null)
		{
			if (splatMesh.isPaused())
			{
				console.log("Playing");
				splatMesh.play();
				event.target.innerHTML = "Pause";
			}else
			{
				console.log("Pausing");
				splatMesh.pause();
				event.target.innerHTML = "Play";
			}
		}
	});
	
	document.getElementById("playbackrate").addEventListener("change", event =>
	{
		if (splatMesh !== null)
		{
			splatMesh.playbackRate = parseFloat(event.target.value);
		}
	});
	
	splatMesh.on(RyskEvents.buffering, () => console.log("buffering"));
	splatMesh.on(RyskEvents.playing, () => console.log("playing"));
	splatMesh.on(RyskEvents.videoEnded, () => console.log("vide ended"));

	splatMesh.getDuration().then(duration =>
	{
		progress.setAttribute("max", duration);
	});

	splatMesh.onMediaEvent("timeupdate",() => 
	{
		progress.value = splatMesh.getCurrentTime();
	});


	// FPS logic
/*	const fpsCounter = document.getElementById("fpsCounter");
	let lastTime = performance.now();
	let frameCount = 0;
	let fps = 0;

	function updateFPS() {
		const now = performance.now();
		frameCount++;

		if (now - lastTime >= 1000) {
			fps = frameCount;
			frameCount = 0;
			lastTime = now;
			fpsCounter.innerHTML = `FPS: ${fps}<br/>Decode: ${splatMesh.fps}<br/>Sort: ${splatMesh.lastSortTime.toFixed(2)}ms`;
		}
	}
*/
	renderer.setAnimationLoop((timestamp, frame) => 
	{		
		splatMesh.update(camera);
		
		if (splatMesh.canRender()) 
		{	
			renderer.render(scene, camera);
			//updateFPS();
		}
	});
}
