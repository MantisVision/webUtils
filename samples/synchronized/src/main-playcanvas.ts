import { URLMesh } from "@mantisvision/ryskplaycanvas";
import { MantisLog } from "@mantisvision/utils";
import * as pc from "playcanvas";

import VideoSync, { TimingObject, VideoSyncEvents } from "@mantisvision/synchronizer";
import * as TIMINGSRC from "./timingsrc.js";

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
	var app = null;
	try
	{
		const canvas = <HTMLCanvasElement>document.getElementById('playcanvas');
		if (canvas)
		{
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
			camera.setPosition(0, 1.5, 2.2);
			camera.setEulerAngles(-13, 0, 0);

			// create directional light entity
			const light = new pc.Entity('light');
			light.addComponent('light');
			app.root.addChild(light);
			light.setEulerAngles(45, 180, 0);
			run(app);
		}
	}catch (err)
	{
		console.error(err);
	}
});

/**
 * Runs the whole animation
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.PerspectiveCamera} camera
 * @returns {undefined}
 */
function run(app: pc.Application)
{
	try
	{
		const chloeRYSK = new URLMesh(chloe_video, chloe_data);
		const robRYSK = new URLMesh(rob_video, rob_data);
		chloeRYSK.setPreviewMode(true);
		robRYSK.setPreviewMode(true);
		synchronizer.addMedia([chloeRYSK, robRYSK]).then(() => synchronizer.setLoop([chloeRYSK, robRYSK], true));

		const progress = <HTMLProgressElement>document.getElementById("progress");
	
		progress.addEventListener("click", event => 
		{
			const duration = synchronizer.getDuration();
			if (duration > 0)
			{
				const pos = (event.pageX - progress.offsetLeft - (<HTMLDivElement>(progress.offsetParent)).offsetLeft) / progress.offsetWidth;
				synchronizer.jumpAt(pos * duration);
			}
		});

		synchronizer.on(VideoSyncEvents.durationchange, newduration => 
		{
			if (newduration) progress.setAttribute("max", newduration.toString());
		});
		synchronizer.on(VideoSyncEvents.timeupdate, newtime =>
		{
			if (newtime) progress.value = newtime;
		});

		chloeRYSK.run().then(entity => 
		{//add mesh to the scene
			if (entity)
			{
				entity.enabled = true;
				entity.setPosition(-1,0,0);
				app.root.addChild(entity);
			}
		}).catch(console.error); 

		robRYSK.run().then(entity => 
		{//add mesh to the scene
			if (entity)
			{
				entity.enabled = true;
				entity.setPosition(1,0,0);
				app.root.addChild(entity);
			}
		}).catch(console.error); 

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
		
		app.start();
		app.on("frameupdate",() => 
		{ 
			chloeRYSK.update();
			robRYSK.update();
		});
	}catch (err)
	{
		console.error(err);
	}
}
