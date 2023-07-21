var UrlmeshShort = pc.createScript('urlmeshshort');

// true - video will loop, false - video stops at the end
UrlmeshShort.attributes.add('loop', { type: 'boolean',default: false });

UrlmeshShort.attributes.add('videourl', { type: 'string',default: '' });

UrlmeshShort.attributes.add('dataurl', { type: 'string',default: '' });

/**
 * Initialize method is called once per entity the script is attached to. Its main purpose is to set listeners
 * for control entities (play/pause button, progress bar...) and load @mantisvision/ryskplaycanvas library
 */
UrlmeshShort.prototype.initialize = function() 
{
    this.playing = false;   // whether the video is currently playing
    this.sound = true;      // whether the sound is turned on
    this.buffering = false; // whether the video is buffering
    this.ryskObj = null;

    //create the listener by binding "this" object so they can access it from within when they're called
    this.updateRyskObjThis = this.updateRyskObj.bind(this);

    //old Safari on MacOS (< 15.4) and Firefox don't have requestVideoFrameCallback method on HTMLVideoElement
    this.firefox = !("requestVideoFrameCallback" in HTMLVideoElement.prototype);

    //release resources if "destory" event is received
    this.on("destroy", this.dispose, this);

    //create a promise which will get resolved once the @mantisvision/ryskplaycanvas library gets loaded
    this.importFinished = new Promise((resolve,reject) => 
    {
        if (!window.hasOwnProperty("Rysk"))
        {//import the library, but only if the Rysk global variable hasn't been set yet (that would mean the library was already imported)
            const asset = pc.Application.getApplication().assets.find('MantisRYSKPlayCanvas.min.js');
            import(asset.getFileUrl()).then(() => 
            {
                window.MantisUtils = { MantisLog: window.Rysk.MantisLog };
                window.Rysk.MantisLog.SetLogLevel(4);
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
UrlmeshShort.prototype.run = async function()
{
    if (this.ryskObj && (!this.dataurl || !this.videourl))
    {//remove an already existing ryksObj if dataURL or videoURL aren't set
        this.dispose();
    }else if (this.ryskObj === null)
    {//if dataURL or videoURL have changed or ryskObj hasn't been created yet
        
        await this.importFinished; 
         // once the import of the @mantisvision/ryskplaycanvas library is finished create a new mesh
        this.createMesh(window.Rysk.URLMesh,this.dataurl,this.videourl);
    }
};

/**
 * Returns the underlying RYSK object
 */
UrlmeshShort.prototype.getRYSKObj = function()
{
    return this.ryskObj;
};

/**
 * Helper method which is responsible for the creation of a new RYSK mesh
 * @param {URLMesh} URLMesh reference to the class which is going to be used to create a new RYSK mesh
 * @param {String} dataURL URL of the .syk file
 * @param {String} videoURL URL of the video (or m3u8 playlist for HLS)
 */
UrlmeshShort.prototype.createMesh = function(URLMesh,dataURL,videoURL)
{
    if (this.ryskObj !== null)
    {// when creating the new object, we first need to dispose an old one if there is such
        this.dispose();
    }

    // Create a new ryskObj using URLMesh class. The third argument is the default size of the internal
    // buffer which is used to store the RYSK data and the fourth is a reference to the global
    // PlayCanvas object.
    this.ryskObj = new URLMesh(videoURL,dataURL,50,pc);
    this.ryskObj.setPreviewMode(true);

    //shows errors in the console
    this.ryskObj.on("error",console.error);

    // Attach a listener to ended event in order to loop the video if the script's loop attribute is set
    // This could also be done simply by setting "loop" property of the ryskObj to true, but that may cause
    // trouble with looping the video on iOS if there is more than one mesh in the scene (iOS doesn't
    // particularly like playing two unmuted videos at the same time),
    this.ryskObj.loop = this.loop;
    
    // URLMesh constructor sets the necessary variables, but by design doesn't starts
    // the internal processes to downlaod and decode RYSK data. run() must be called
    // in order to do that. It resolves with the PlayCanvas entity which can
    // be inserted into the scene. 
    this.ryskObj.run().then(entity => 
    {
        if (entity)
        {
            //remove the old render component (the preview figurine)
            this.entity.removeComponent("render");
            
            entity.enabled = true; //entity is by default disabled
            //add the entity to the scene as a child this entity
            this.entity.addChild(entity);
        }
    }).catch(console.error);
};


/**
 * Once the ryskObj is no longer needed, this method detaches callbacks, removes
 * the render component from this entity and destroys the RYSK mesh in order
 * to free the memory.
 */
UrlmeshShort.prototype.dispose = function()
{
    if (this.ryskObj !== null)
    {
        const obj = this.ryskObj;
        this.ryskObj = null;

        this.entity.removeChild(obj.getEntity());
        obj.dispose();
    }
};

/**
 * For Firefox and old Safari on MacOS, update() method of ryskObj must be called in requestAnimationFrame
 * of window, otherwise there might be issues with the texture.
 */
UrlmeshShort.prototype.updateRyskObj = function()
{
    if (this.ryskObj !== null) this.ryskObj.update();
    window.requestAnimationFrame(this.updateRyskObjThis);
};

/**
 * For other browsers, we can rely on update() method which is automatically called by PlayCanvas each rendering frame.
 */
UrlmeshShort.prototype.update = function()
{
    if (!this.firefox && this.ryskObj !== null) 
    {//the first part of if checks whther browser isn't Firefox or old Safari (they have event name lodeddata and use requestAnimationFrame callback instead)
        this.ryskObj.update();
    }
};
