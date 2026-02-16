window.addEventListener('load',function()
{
	const chloeModel = document.querySelector("#chloe");
	const phillipsModel = document.querySelector("#phillips");
	var playing = false;
	const playButton = document.getElementById("play");
	var duration = 0;
	
	const progress = document.getElementById("progress");
	
	progress.addEventListener("click", event => 
	{
		if (duration)
		{
			const pos = (event.pageX - progress.offsetLeft - progress.offsetParent.offsetLeft) / progress.offsetWidth;
			chloeModel.setAttribute("time",pos * duration);
			phillipsModel.setAttribute("time",pos * duration);
		}
	});

	const playbackRate = document.getElementById("playbackrate");
	playbackRate.addEventListener("change", event => 
	{
		chloeModel.setAttribute("playbackrate", playbackRate.value);
		phillipsModel.setAttribute("playbackrate", playbackRate.value);
	});
	
	chloeModel.addEventListener("timeupdate", event => 
	{
		if (!duration)
		{
			progress.setAttribute("max", event.detail.duration);
			duration = event.detail.duration;
		}
		progress.value = event.detail.currentTime;
	});

	playButton.addEventListener("click",() => 
	{
		if (playing)
		{
			playButton.innerHTML = "PLAY";
			chloeModel.emit("ryskpause");
			phillipsModel.emit("ryskpause");
			playing = false;
		}else
		{
			playButton.innerHTML = "PAUSE";
			chloeModel.emit("ryskplay");
			phillipsModel.emit("ryskplay");
			playing = true;
		}
	});
});