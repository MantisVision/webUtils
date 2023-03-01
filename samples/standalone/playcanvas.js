const video_url = "./chloe_battle.mp4";
const data_url = "./chloe_battle.syk";

document.addEventListener('DOMContentLoaded',function()
{
	window.Rysk.MantisLog.SetLogLevel(window.Rysk.MantisLog.WARNINGS | window.Rysk.MantisLog.ERRORS);
	var app = null;
	try
	{
		const canvas = document.getElementById('playcanvas');
		app = new pc.Application(canvas);
		const scene = app.scene;

		app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
		app.setCanvasResolution(pc.RESOLUTION_AUTO);

		const camera = new pc.Entity('camera');
		camera.addComponent('camera', {
			clearColor: new pc.Color(1, 1, 1),
			projection: pc.PROJECTION_PERSPECTIVE,
			fov: 70
		});
		app.root.addChild(camera);
		camera.setPosition(0, 1.5, -1);
		camera.setEulerAngles(0, 180, 0);

		// create directional light entity
		const light = new pc.Entity('light');
		light.addComponent('light');
		app.root.addChild(light);
		light.setEulerAngles(45, 180, 0);
	}catch (err)
	{
		console.error(err);
	}
	run(app);
});

/**
 * Runs the whole animation
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.PerspectiveCamera} camera
 * @returns {undefined}
 */
function run(app)
{
	try
	{
		const ryskObj = new window.Rysk.URLMesh(video_url,data_url,pc);
		
		const progress = document.getElementById("progress");

		progress.addEventListener("click", event => 
		{
			const pos = (event.pageX - progress.offsetLeft - progress.offsetParent.offsetLeft) / progress.offsetWidth;
			ryskObj.getDuration().then(duration => ryskObj.jumpAt(pos * duration));
		});

		ryskObj.getDuration().then(duration =>
		{
			progress.setAttribute("max", duration);
		});

		ryskObj.onVideoEvent("timeupdate",() => 
		{
			progress.value = ryskObj.getVideoElement().currentTime;
		});
		
		ryskObj.run().then(mesh => 
		{//add mesh to the scene
			mesh.visible = true;
			const entity = new pc.Entity();
			
			entity.addComponent('render',{ meshInstances: [mesh] });		
			
			app.root.addChild(entity);
			entity.setPosition(0,0,1)
			const scale = new pc.Vec3(0.001,0.001,0.001);
			entity.setLocalScale(scale);
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
		
		app.start();
		app.on("frameupdate",() => ryskObj.update());
	}catch (err)
	{
		console.error(err);
	}
}
