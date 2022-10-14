import * as three from "https://unpkg.com/three@0.141.0";

const video_url = "https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.mp4";
const data_url = "https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.syk";

document.addEventListener('DOMContentLoaded',function()
{
	import("./MantisRYSK.min.js").then(() => 
	{
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
		run2(renderer,scene,camera);
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
	const ryskObj = new Rysk.RYSKUrl(video_url,data_url);
	
	ryskObj.run().then(mesh => 
	{//add mesh to the scene
		mesh.visible = true;
		scene.add(mesh);
	}); 
	
	document.getElementById("play").addEventListener("click",event =>
	{//event listener for the button which plays/pauses the animation
		if (ryskObj !== null)
		{
			if (ryskObj.isPaused())
			{
				ryskObj.play();
				event.target.innerHTML = "Pause";
			}else
			{
				ryskObj.pause();
				event.target.innerHTML = "Play";
			}
		}
	});
	
	renderer.setAnimationLoop((timestamp, frame) => 
	{//animation loop to render each frame-
		if (ryskObj !== null)
		{
			ryskObj.update();
		}
		redrawCanvas();
		renderer.clear(true, true, true);
		renderer.render(scene, camera);
	});
}

function run2(renderer,scene,camera)
{
	const mesh = createMesh2();
	scene.add(mesh);
	renderer.setAnimationLoop((timestamp, frame) => 
	{
		redrawCanvas();
		renderer.clear(true, true, true);
		renderer.render(scene, camera);
	});
}

function createMesh2()
{
	const geometry = new  THREE.PlaneBufferGeometry( 1,1, 2,2 );
	const canvas2 = new OffscreenCanvas(128, 128);
	context = canvas2.getContext("2d");

	texture = new THREE.DataTexture(context.getImageData(0,0,128,128).data,128,128);
	texture.needsUpdate = true;
	const material = new THREE.MeshBasicMaterial({ map: texture });
	material.side = THREE.DoubleSide;
	return new THREE.Mesh(geometry, material);
}

function redrawCanvas()
{
	context.clearRect(0, 0, context.canvas.width, context.canvas.height);
	context.beginPath();
	context.arc(64, 64, ++iterator, 0, 2 * Math.PI);
	context.fillStyle = "#FF0000"; 
	context.fill();
	texture.image.data = context.getImageData(0,0,128,128).data;
	texture.needsUpdate = true;
	if (iterator > 64) iterator = 0;
}

var iterator = 0;
var context = null;
var texture = null;

