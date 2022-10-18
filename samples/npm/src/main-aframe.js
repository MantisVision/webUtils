import 'aframe';

console.log("here here");
import('@mantisvision/ryskaframe').then(() => 
{
	console.log("ryskaframe imported");
}).catch(console.error);

window.addEventListener('load',function()
{
	const aframeModel = document.querySelector("#chloe");
	var playing = false;
	const playButton = document.getElementById("play");
	
	playButton.addEventListener("click",() => 
	{
		if (playing)
		{
			playButton.innerHTML = "PLAY";
			aframeModel.emit("ryskpause");
			playing = false;
		}else
		{
			playButton.innerHTML = "PAUSE";
			aframeModel.emit("ryskplay");
			playing = true;
		}
	});
});
