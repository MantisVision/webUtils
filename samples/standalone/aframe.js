window.addEventListener('load',function()
{
	const aframeModel = document.querySelector("#chloe");
	var playing = false;
	const playButton = document.getElementById("play");
	var duration = 0;
	
	const progress = document.getElementById("progress");
	
	progress.addEventListener("click", event => 
	{
		if (duration)
		{
			const pos = (event.pageX - progress.offsetLeft - progress.offsetParent.offsetLeft) / progress.offsetWidth;
			aframeModel.setAttribute("time",pos * duration);
		}
	});

	const playbackRate = document.getElementById("playbackrate");
	playbackRate.addEventListener("change", event => 
	{
		aframeModel.setAttribute("playbackrate", playbackRate.value);
	});
	
	aframeModel.addEventListener("timeupdate", event => 
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