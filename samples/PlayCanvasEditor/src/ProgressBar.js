var ProgressBar = pc.createScript('progressBar');

// The entity that shows the prgress
ProgressBar.attributes.add('progressImage', {type: 'entity'});

// initialize code called once per entity
ProgressBar.prototype.initialize = function() 
{
    this.duration = 0;
    this.entity.element.on("click",this.handleClick.bind(this));
};

/**
 * Exposed API so that the script handling RYSK object can set the duration of the video.
 */
ProgressBar.prototype.setDuration = function(duration)
{
    this.duration = duration;
};

/**
 * Exposed API so that the script handling RYSK object can change the progress bar based
 * on the current timestamp of the video.
 */
ProgressBar.prototype.setProgress = function(timestamp)
{
    if (this.duration > 0 && timestamp > 0)
    {
        this.progressImage.element.width = timestamp > this.duration
                                        ? this.entity.element.width
                                        : Math.round(timestamp / this.duration * this.entity.element.width);
    }else
    {
        this.progressImage.element.width = 0;
    }
};

/**
 * Callback which listens for click event on the progress bar and fires jump event which the RYSK script
 * listens for to jump to a proper timestamp in the video.
 */
ProgressBar.prototype.handleClick = function(event) 
{
    if (this.duration > 0)
    {
        const touchX = event.x - this.entity.element.canvasCorners[0].x;
        const realWidth = this.entity.element.canvasCorners[1].x - this.entity.element.canvasCorners[0].x;
        this.fire("jump", touchX / realWidth * this.duration);
    }
};
