import Phaser, { Scene } from "phaser"

export default class Carrot extends Phaser.Physics.Arcade.Sprite {
    /**
    * @param {Phaser.Scene} scene
    * @param {number} x
    * @param {number} y
    * @param {string} texture
    */
    constructor(scene: Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture)

        this.setScale(0.5)
    }
}
