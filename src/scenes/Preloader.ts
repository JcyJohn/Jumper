import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');
        this.load.image("platform","PNG/Environment/ground_grass.png")
        this.load.image('bunny-stand', 'PNG/Players/bunny1_stand.png')
        this.load.image('carrot', 'PNG/items/carrot.png')
        this.load.image('bunny-jump', 'PNG/Players/bunny1_jump.png')
        
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
