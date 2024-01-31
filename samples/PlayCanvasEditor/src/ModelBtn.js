var ModelBtn = pc.createScript('ModelBtn');
ModelBtn.attributes.add('RYSKMesh', { type: 'entity', description: 'Mesh controlled by this button' });
ModelBtn.attributes.add('videoURL', { type: 'string' });
ModelBtn.attributes.add('dataURL', { type: 'string' });
ModelBtn.attributes.add('beginning', { type: 'number', default: 0 });
ModelBtn.attributes.add('end', { type: 'number', default: 0 });
/*ModelBtn.attributes.add('inEditor', {
    type: "boolean",
    default: true,
    title: "ModelBtn",
});*/


// initialize code called once per entity
ModelBtn.prototype.initialize = function()
{
    // attach event listener on click of the button
    this.entity.button.on('click', function(event)
    {
        const scripts = this.RYSKMesh.findComponents("script");
        for (var script of scripts)
        {
            if ("urlmesh" in script)
            {//for the "Showcase" scene
                script.urlmesh.play(this.dataURL, this.videoURL, this.beginning, this.end);
                break;
            }else if ("ryskurl" in script)
            {//for the "Low level scripting" scene
                script.ryskurl.play(this.dataURL, this.videoURL, this.beginning, this.end);
                break;
            }
        }
    }, this);
};
