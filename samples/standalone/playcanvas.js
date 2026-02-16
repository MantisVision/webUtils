const video_url = "./chloe_battle.mp4";
const data_url = "./chloe_battle.syk";

document.addEventListener('DOMContentLoaded',function()
{
	import("./MantisRYSKPlayCanvas.min.js").then(() => 
	{
		Rysk.MantisLog.SetLogLevel(window.Rysk.MantisLog.WARNINGS | window.Rysk.MantisLog.ERRORS);
		var app = null;
		try
		{
			const canvas = document.getElementById('playcanvas');
			app = new pc.Application(canvas);

			app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
			app.setCanvasResolution(pc.RESOLUTION_AUTO);

			const camera = new pc.Entity('camera');
			camera.addComponent('camera', {
				clearColor: new pc.Color(1, 1, 1),
				projection: pc.PROJECTION_PERSPECTIVE,
				fov: 70
			});
			app.root.addChild(camera);
			camera.setPosition(0, 1.5, 2.2);
			camera.setEulerAngles(-13, 0, 0);

			// create directional light entity
			const light = new pc.Entity('light');
			light.addComponent('light');
			app.root.addChild(light);
			light.setEulerAngles(-13, 0, 0);
		}catch (err)
		{
			console.error(err);
		}
		run(app);
	});
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
		const ryskObj = new window.Rysk.URLMesh({
			playCanvas: pc,
			mediaurl: video_url,
			dataurl: data_url,
			frameBufferSize: 12,
			previewMode: true,
			autoinit: {
				onSuccess(result)
				{
					ryskObj.setVolume(1);
					result.mesh.enabled = true;			
					app.root.addChild(result.mesh);
				},
				onError: console.error
			}
		});
		
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

		ryskObj.onMediaEvent("timeupdate",() => 
		{
			progress.value = ryskObj.getMediaElement().currentTime;
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

		document.getElementById("playbackrate").addEventListener("change", event =>
		{
			if (ryskObj !== null)
			{
				ryskObj.playbackRate = parseFloat(event.target.value);
			}
		});
		
		app.start();
	}catch (err)
	{
		console.error(err);
	}
}
