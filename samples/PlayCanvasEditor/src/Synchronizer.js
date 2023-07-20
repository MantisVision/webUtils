var Synchronizer = pc.createScript('synchronizer');

//entity for showing the progress of the video
Synchronizer.attributes.add('progressbar', {type: 'entity', description: 'Progressbar showing the play progress of the mesh', default: false});
//button for playing/pausing the video
Synchronizer.attributes.add('playpausebutton', {type: 'entity', description: 'Button for Playing/Pausing', default: false});
//button for stopping the video
Synchronizer.attributes.add('stopbutton', {type: 'entity', description: 'Button to stop the video', default: false});
//button for turning the volume on/off
Synchronizer.attributes.add('volumebutton', {type: 'entity', description: 'Button for turning the volume on/off', default: false});
//button for turning the volume on/off
Synchronizer.attributes.add('ryskmeshes', {type: 'entity', array: true, description: 'List of meshes to synchronize'});

// initialize code called once per entity
Synchronizer.prototype.initialize = function() 
{
    this.videoSync = null;
    this.playing = false;
    this.sound = true;

    // play, pause, stop, jump and volume are now all handled through the RyskSynchronizer object
    // which internally calls the appropriate methods on the videos it manages

    //handle the play/pause button
    if (this.playpausebutton)
    {
        this.playpausebutton.element.on("click",() => 
        {
            if (this.videoSync)
            {
                if (this.playing) 
                {
                    this.videoSync.pause();
                } else
                {//show the mesh in case it's hidden
                    this.videoSync.play().then(() => 
                    {
                        for (var ryskUrl of this.videoSync.getMedia())
                        {//make all the underlying meshes visible
                            const entity = ryskUrl.getEntity();
                            if (entity) entity.enabled = true;
                        }
                    });
                } 
                this.playing = !this.playing;
                this.playpausebutton.children[0].element.text = this.playing ? "Pause" : "Play"; //change the text of the button
            }
        });
    }

    //handle the button for turning the volume up/down
    if (this.volumebutton)
    {
        this.volumebutton.element.on("click",() => 
        {
            if (this.videoSync)
            {
                const volume = this.sound ? 0 : 1;
                this.videoSync.setVolume(volume);
                
                this.sound = !this.sound;
                this.volumebutton.children[0].element.text = this.sound ? "Volume OFF" : "Volume ON"; //change the text of the button
            }
        });
    }

     //handle the stop button
    if (this.stopbutton)
    {
        this.stopbutton.element.on("click",() => 
        {
            if (this.videoSync)
            {
                this.videoSync.stop();               
                this.playing = false;
                if (this.playpausebutton) this.playpausebutton.children[0].element.text = "Play";
            }
        });
    }

    //handle the progress bar
    if (this.progressbar)
    {
        const scripts = this.progressbar.findComponents("script");
        //get reference to progressBar script in order to use its API
        for (var script of scripts)
        {
            if ("progressBar" in script)
            {
                this.progressbarObj = script.progressBar;
                break;
            }
        }

        this.showProgressThis = this.showProgress.bind(this);
        this.changeDurationThis = this.changeDuration.bind(this);
        this.handleProgressbarClickThis = this.handleProgressbarClick.bind(this);
        //attach listener for "jump" event in order to jump to the given timestamp
        this.progressbarObj.on("jump",this.handleProgressbarClickThis);
    }

    // clean the VideoSync object when the destroy event comes
    this.on("destroy",() =>
    {
        if (this.videoSync)
        {
            this.videoSync.finish();
            this.videoSync = null;
        }
    });
    
    if (this.videoSync === null)
    {// We have to import not only MantisSynchronizer library, but also the 3rd party
     // timingsrc which provides TimingObject that the RyskSynchronizer internally uses
     // to synchronize all the videos it manages.
        const toModule = pc.Application.getApplication().assets.find('timingsrc.js');
        const vsModule = pc.Application.getApplication().assets.find('MantisSynchronizer.min.js');
        const imports = [
            import(toModule.getFileUrl()),
            import(vsModule.getFileUrl())
        ];

        const scripts = [];
        Promise.all(imports).then(() => 
        {//libraries are imported, so we can create the RyskSynchronizer object
            this.videoSync = new window.RyskSynchronizer(window.TIMINGSRC.TimingObject);
            
            //now we attach the listeners to timeupdate and durationchange event to set the progressbar
            this.videoSync.on("timeupdate", this.showProgressThis);
            this.videoSync.on("durationchange", this.changeDurationThis);

            //we want to wait till the user hits "play" button
            this.videoSync.setAutoplay(false);
            const promises = [];
            const rysks = [];

            for (var mesh of this.ryskmeshes)
            {// now cycle through all the entities which the synchronizer should manage
             // and execute the run() call 
                const meshscripts = mesh.findComponents("script");
                for (var script of meshscripts)
                {
                    if ("RyskurlShort" in script)
                    {
                        promises.push(script.RyskurlShort.run());
                        scripts.push(script.RyskurlShort);
                        break;
                    }
                }
            }
            return Promise.all(promises);
        }).then(() =>
        {// run() method of all RyskurlShort scripts was executed
            const rysks = [];
            if (this.videoSync)
            {// turn on the volume and add the rysks to the synchronizer
                this.videoSync.setVolume(1);
                for (var script of scripts)
                {
                    rysks.push(script.getRYSKObj());
                }
                this.videoSync.addMedia(rysks);
            }

            if (this.playpausebutton) this.playpausebutton.enabled = true;
            if (this.volumebutton) this.volumebutton.enabled = true;
            if (this.progressbar) this.progressbar.enabled = true;
            if (this.stopbutton) this.stopbutton.enabled = true;
        }).catch(err => 
        {
            console.log("error caught");
            console.error(err);
        });
    }
};

// update code called every frame
Synchronizer.prototype.update = function(dt) {

};

/**
 * Callback attached to the timeupdate event of the synchronizer
 * @param {float} timestamp current timestamp of the playback
 */
Synchronizer.prototype.showProgress = function(timestamp)
{
    if (this.progressbar)
    {
        this.progressbarObj.setProgress(timestamp);
    }
};

/**
 * Callback attached to the durationchange event of the synchronizer
 * @param {float} newDuration new duration of the progressbar
 */
Synchronizer.prototype.changeDuration = function(newDuration)
{
    if (this.progressbar)
    {
        this.progressbarObj.setDuration(newDuration);
    }
};

/**
 * Callback attached to jump event of the progress bar
 * @param {float} timestamp time in seconds where the video should jump.
 */
Synchronizer.prototype.handleProgressbarClick = function(timestamp) 
{
    if (this.videoSync)
    {
        this.videoSync.jumpAt(timestamp);
    }
};

/**
 * Once the synchronizer is no longer needed, this method detaches callback and destroys
 * the syncrhonizer in order to free the memory.
 */
Synchronizer.prototype.dispose = function()
{
    if (this.videoSync !== null)
    {
        const videoSync = this.videoSync;
        this.videoSync = null;

        videoSync.off("timeupdate",this.showProgressThis);
        videoSync.off("durationchange",this.changeDurationThis);
        
        if (this.progressbar)
        {
            videoSync.offVideoEvent("timeupdate",this.showProgressThis);
        }
        this.entity.removeComponent('render');
        videoSync.finish();
    }
};
