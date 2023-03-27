var Ryskurl = pc.createScript('ryskurl');

// true - video will loop, false - video stops at the end
Ryskurl.attributes.add('loop', { type: 'boolean',default: false });
//entity for showing the progress of the video
Ryskurl.attributes.add('progressbar', {type: 'entity', description: 'Progressbar showing the play progress of the mesh', default: false});
//button for playing/pausing the video
Ryskurl.attributes.add('playpausebutton', {type: 'entity', description: 'Button for Playing/Pausing', default: false});
//button for stopping the video
Ryskurl.attributes.add('stopbutton', {type: 'entity', description: 'Button to stop the video', default: false});
//button for turning the volume on/off
Ryskurl.attributes.add('volumebutton', {type: 'entity', description: 'Button for turning the volume on/off', default: false});

/**
 * Initialize method is called once per entity the script is attached to. Its main purpose is to set listeners
 * for control entities (play/pause button, progress bar...) and load @mantisvision/ryskplaycanvas library
 */
Ryskurl.prototype.initialize = function() 
{
    this.playing = false;   // whether the video is currently playing
    this.sound = true;      // whether the sound is turned on
    this.buffering = false; // whether the video is buffering
    this.ryskObj = null;
    this.dataURL = '';
    this.videoURL = '';

    //create the listeners by binding "this" object so they can access it from within when they're called
    this.showFrameNoThis = this.showFrameNo.bind(this);
    this.showBufferingThis = this.showBuffering.bind(this);
    this.bufferingFinishedThis = this.bufferingFinished.bind(this);
    this.updateRyskObjThis = this.updateRyskObj.bind(this);
    this.loopVideoThis = this.loopVideo.bind(this);
    this.canplaythroughThis = this.canplaythrough.bind(this);

    //old Safari on MacOS (< 15.4) and Firefox don't have requestVideoFrameCallback method on HTMLVideoElement
    this.firefox = !("requestVideoFrameCallback" in HTMLVideoElement.prototype);

    //handle the play/pause button
    if (this.playpausebutton)
    {
        this.playpausebutton.element.on("click",() => 
        {
            if (this.ryskObj)
            {
                if (this.playing) this.ryskObj.pause();
                else
                {
                    this.ryskObj.play();
                    //show the mesh in case it's hiddne
                    this.ryskObj.getMesh().visible = true;
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
            if (this.ryskObj)
            {
                if (this.sound) this.ryskObj.setVolume(0);
                else this.ryskObj.setVolume(1);
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
            if (this.ryskObj)
            {
                this.ryskObj.stop();
                this.ryskObj.getMesh().visible = false; //hide the mesh
                if (this.progressbarObj) 
                {
                    this.progressbarObj.setProgress(0); //reset the progress bar
                    this.progressbarObj.setFrameNo(0);
                }
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

        this.showProgressThis =  this.showProgress.bind(this);
        this.handleProgressbarClickThis = this.handleProgressbarClick.bind(this);
        //attach listener for "jump" event in order to jump to the given timestamp
        this.progressbarObj.on("jump",this.handleProgressbarClickThis);
    }    

    //create a promise which will get resolved once the @mantisvision/ryskplaycanvas library gets loaded
    this.importFinished = new Promise((resolve,reject) => 
    {
        if (!window.hasOwnProperty("Rysk"))
        {//import the library, but only if the Rysk global variable hasn't been set yet (that would mean the library was already imported)
            const asset = pc.Application.getApplication().assets.find('MantisRYSKPlayCanvas.min.js');
            import(asset.getFileUrl()).then(() => 
            {
                resolve();
            });
        }else 
        {
            resolve();
        }
    });

    if (this.firefox)
    {//periodically call the update method on the rysk object
        window.requestAnimationFrame(this.updateRyskObjThis);
    }
};

/**
 * The main method of this script which is called to create a new RYSK mesh, place it
 * into the scene and start playing it.
 * @param {String} dataURL url of the .syk file
 * @param {String} videoURL url of the video
 */
Ryskurl.prototype.play = function(dataURL,videoURL)
{
    if (this.ryskObj && (!dataURL || !videoURL))
    {//remove an already existing ryksObj if dataURL or videoURL aren't set
        this.dispose();
    }else if (this.ryskObj === null || (this.dataURL !== dataURL && this.videoURL !== videoURL))
    {//if dataURL or videoURL have changed or ryskObj hasn't been created yet
        this.dataURL = dataURL;
        this.videoURL = videoURL;
        
        this.importFinished.then(() => 
            {// once the import of the @mantisvision/ryskplaycanvas library is finished...
                window.Rysk.MantisLog.SetLogLevel(4);
                this.dispose(); //...destroy an existing ryskObj...
                this.createMesh(window.Rysk.URLMesh,dataURL,videoURL); //...and create a new one
            });
    }else
    {//if nothing has changed, merely trigger play() on the ryskObj
        this.playing = true;
        this.ryskObj.play();
    }
};

/**
 * Helper method which is responsible for the creation of a new RYSK mesh
 * @param {URLMesh} URLMesh reference to the class which is going to be used to create a new RYSK mesh
 * @param {String} dataURL URL of the .syk file
 * @param {String} videoURL URL of the video (or m3u8 playlist for HLS)
 */
Ryskurl.prototype.createMesh = function(URLMesh,dataURL,videoURL)
{
    this.showBuffering();
    if (this.ryskObj !== null)
    {// when creating the new object, we first need to dispose an old one if there is such
        this.dispose();
    }
    // Create a new ryskObj using URLMesh class. The third argument is reference to the global
    // PlayCanvas object and the fourth is the default size of the internal buffer which is used
    // to store the RYSK data.
    this.ryskObj = new URLMesh(videoURL,dataURL,pc,50);
    
    // Register a callback which is triggered each time a new frame is displayed.
    // The callback shows the frame number as text of frameNo entity given as the script's attribute
    this.ryskObj.on("dataDecoded",this.showFrameNoThis);
    //shows errors in the console
    this.ryskObj.on("error",console.error);
    //shows text signaling whether the mesh is buffering either data from .syk file or the video
    this.ryskObj.on("buffering",this.showBufferingThis);
    this.ryskObj.on("buffered",this.bufferingFinishedThis);
    // Attach a listener to ended event in order to loop the video if the script's loop attribute is set
    // This could also be done simply by setting "loop" property of the ryskObj to true, but that may cause
    // trouble with looping the video on iOS if there is more than one mesh in the scene (iOS doesn't
    // particularly like playing two unmuted videos at the same time),
    this.ryskObj.loop = false;
    this.ryskObj.onVideoEvent("ended",this.loopVideoThis);
    //RYSK mesh doesn't autoplay by default, so we wait till canplaythrough event is fired and then
    //start the video automatically. This could also be done by simply calling the play() of the ryskObj
    this.ryskObj.onVideoEvent("canplaythrough",this.canplaythroughThis);

    if (this.progressbar)
    {//attach a listener to the "timeupdate" event of the RYSK mesh's video in order to update
    // the progressbar as the video plays
        this.ryskObj.onVideoEvent("timeupdate",this.showProgressThis);
        this.ryskObj.getDuration().then(duration => this.progressbarObj.setDuration(duration));
    }
    
    // URLMesh constructor sets the necessary variables, but by design doesn't starts
    // the internal processes to downlaod and decode RYSK data. run() must be called
    // in order to do that. It resolves with the PlayCanvas mesh instance which can
    // be inserted into the scene. However, bear in mind that it's resolved only once
    // the video starts playing by calling play() method of ryskObj, because the texture
    // of the mesh can't be constructed unless the video is playing.
    this.ryskObj.run().then(meshInstance => 
    {
        if (meshInstance)
        {
            console.log("Got mesh instance");
            meshInstance.visible = true; //meshinstance has the visibility set to false by default
            //display the control elements
            if (this.playpausebutton) this.playpausebutton.enabled = true;
            if (this.volumebutton) this.volumebutton.enabled = true;
            if (this.progressbar) this.progressbar.enabled = true;
            if (this.stopbutton) this.stopbutton.enabled = true;
            //add the mesh instance to the scene as a render component of this entity
            this.entity.addComponent('render',{ meshInstances: [meshInstance] });
        }
    });
};

/**
 * This method is called in order to start playing the video. It incorporates some
 * dirty hacks in order to achieve autoplay on iOS Safaril.
 */
Ryskurl.prototype.playVideo = function()
{
    if (this.ryskObj !== null) 
    {
        this.ryskObj.setVolume(0); //mute the video. On iOS, only muted video can be autoplayed
        this.ryskObj.play().then(() => 
        {
            this.playing = true; //playing property is to true just to better handle play/pause button
            setTimeout(() => 
            {//after a certain delay (in this case 0.5s) umnute the video. this should trick iOS into playing it
                this.ryskObj.setVolume(this.sound ? 1 : 0);
                if (this.volumebutton) 
                {//change the text on the volume button
                    this.volumebutton.children[0].element.text = "Volume " + (this.sound ? "OFF" : "ON");
                }
            },500);
        });
    }
};

/**
 * Callback which is triggered onnce canplaythrough video event is fired. At that moment, it calls
 * playVideo() method of this script()
 */
Ryskurl.prototype.canplaythrough = function()
{
    if (this.ryskObj)
    {
        this.ryskObj.offVideoEvent("canplaythrough",this.canplaythroughThis);
        this.playVideo();
    }
};

/**
 * Sets the volume of the video.
 */
Ryskurl.prototype.setVolume = function(volume)
{
    if (this.ryskObj !== null) 
    {
        this.ryskObj.setVolume(volume);
        this.sound = volume > 0;
    }
};

/**
 * Once the ryskObj is no longer needed, this method detaches callbacks, removes
 * the render component from this entity and destroys the RYSK mesh in order
 * to free the memory.
 */
Ryskurl.prototype.dispose = function()
{
    if (this.ryskObj !== null)
    {
        const obj = this.ryskObj;
        this.ryskObj = null;

        obj.off("buffering",this.showBufferingThis);
        obj.off("buffered",this.bufferingFinishedThis);
        obj.off("dataDecoded",this.showFrameNoThis);
        obj.offVideoEvent("ended",this.loopVideoThis);
        if (this.progressbar)
        {
            obj.offVideoEvent("timeupdate",this.showProgressThis);
        }
        this.entity.removeComponent('render');
        obj.dispose();
    }
};

/**
 * Callback bind to timeupdate event of the video from RYSK mesh
 */
Ryskurl.prototype.showProgress = function()
{
    if (this.progressbar)
    {
        this.progressbarObj.setProgress(this.ryskObj.getVideoElement().currentTime);
    }
};

/**
 * Callback bound to jump event of the progress bar
 * @param {float} timestamp time in seconds where the video should jump.
 */
Ryskurl.prototype.handleProgressbarClick = function(timestamp) 
{
    if (this.ryskObj)
    {
        this.ryskObj.jumpAt(timestamp);
    }
};

/**
 * For Firefox and old Safari on MacOS, update() method of ryskObj must be called in requestAnimationFrame
 * of window, otherwise there might be issues with the texture.
 */
Ryskurl.prototype.updateRyskObj = function()
{
    if (this.ryskObj !== null) this.ryskObj.update();
    window.requestAnimationFrame(this.updateRyskObjThis);
};

/**
 * For other browsers, we can rely on update() method which is automatically called by PlayCanvas each rendering frame.
 */
Ryskurl.prototype.update = function()
{
    if (!this.firefox && this.ryskObj !== null) 
    {//the first part of if checks whther browser isn't Firefox or old Safari (they have event name lodeddata and use requestAnimationFrame callback instead)
        this.ryskObj.update();
    }
};

/**
 * Pause the RYSK mesh
 */
Ryskurl.prototype.pause = function()
{
    if (this.ryskObj)
    {
        this.playing = false;
        this.ryskObj.pause();
    }
};

/**
 * Callback which is triggered once the video ends. If the video shoulld loop, playVideo method of this script shall be immediately called.
 * This could also be achieved simply by setting loop property on ryskObj, but iOS might then exhibit some issues with playing more than
 * one video.
 */
Ryskurl.prototype.loopVideo = function()
{
    if (this.loop)
    {
        this.playVideo();
    }
};

/**
 * Callback which gets triggered each time a new frame is decoded. It is responsible for showing the frame number
 * on the screen.
 */
Ryskurl.prototype.showFrameNo = function(data)
{
    if (!this.buffering && this.progressbarObj)
    {
        this.progressbarObj.setFrameNo(data.frameNo);
    }
};

/**
 * Callback which gets triggered if the video or data starts to buffer. It shows "Buffering..." text
 * instead of the frame number and mutes the video to avoid a possible issue with iOS.
 */
Ryskurl.prototype.showBuffering = function()
{
    this.buffering = true;
    if (this.sound && this.ryskObj) this.ryskObj.setVolume(0);
    if (this.progressbarObj)
    {
        this.progressbarObj.setFrameNo("Buffering...");
    }
};

/**
 * Callback which gets triggered once the buffering is finished. It sets the volume back to normal.
 */
Ryskurl.prototype.bufferingFinished = function()
{
    console.log("Finished buffering");
    this.buffering = false;
    if (this.sound) setTimeout(() => this.ryskObj.setVolume(1),500);
};
