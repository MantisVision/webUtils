var SwitchScene = pc.createScript('switchScene');
SwitchScene.attributes.add('nextscene', { type: 'string' });


// initialize code called once per entity
SwitchScene.prototype.initialize = function()
{
     // attach event listener on click of the button
    this.entity.button.on('click', function(event)
    {
       this.app.scenes.changeScene(this.nextscene);
    }, this);
};
