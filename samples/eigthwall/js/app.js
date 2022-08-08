const video_url = "https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.mp4";
const data_url = "https://www.mvkb.cc/lib/exe/fetch.php/pub/genady5.syk";

document.addEventListener('DOMContentLoaded',function()
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
	const ryskObj = new window.Rysk.RYSKUrl(video_url,data_url);
	
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
		
		renderer.clear(true, true, true);
		renderer.render(scene, camera);
	});
}

