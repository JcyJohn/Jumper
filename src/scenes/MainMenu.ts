import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../game/EventBus';
import Carrot from '@/game/carrots';

export class MainMenu extends Scene {
    background: GameObjects.Image;
    logo: GameObjects.Image;
    title: GameObjects.Text;
    logoTween: Phaser.Tweens.Tween | null;

    constructor() {
        super('MainMenu');
    }

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors: Phaser.Types.Input.Keyboard.CursorKeys

    preload() {
        if (this.input.keyboard)
            this.cursors = this.input.keyboard.createCursorKeys()
    }

    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    platforms: Phaser.Physics.Arcade.StaticGroup


    /** @type {Phaser.Physics.Arcade.Sprite} */
    player: Phaser.Physics.Arcade.Sprite

    /** @type {Phaser.Physics.Arcade.Group} */
    carrots: Phaser.Physics.Arcade.Group

    carrotsCollected = 0
    carrotsCollectedText: Phaser.GameObjects.Text

    create() {
        // this.physics.add.image(240, 320, 'platform').setScale(0.4)

        this.add.image(240, 320, 'background').setScrollFactor(1, 0);

        // create the group
        this.platforms = this.physics.add.staticGroup()

        // then create 5 platforms from the group
        for (let i = 0; i < 5; ++i) {
            const x = Phaser.Math.Between(80, 400)
            const y = 150 * i

            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, 'platform')
            platform.scale = 0.4

            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body
            body.updateFromGameObject()
        }

        this.player = this.physics.add.sprite(240, 320, 'bunny-stand').setScale(0.4)
        this.physics.add.collider(this.platforms, this.player)

        if (this.player.body !== null) {
            // Solve null check issue
            this.player.body.checkCollision.up = false
            this.player.body.checkCollision.left = false
            this.player.body.checkCollision.right = false
        }
        this.cameras.main.startFollow(this.player)
        this.cameras.main.setDeadzone(this.scale.width * 1.5) // prevent the camera from scroling horziontally

        // const carrot = new Carrot(this, 240, 320, 'carrot')
        // this.add.existing(carrot)

        this.carrots = this.physics.add.group({
            classType: Carrot
        })

        this.physics.add.collider(this.platforms, this.carrots)

        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot, // called on overlap
            undefined,
            this
        )

        const style = { color: '#000', fontSize: 34 }
        this.carrotsCollectedText = this.add.text(240, 40, '0', style)
            .setScrollFactor(0)
            .setOrigin(0.5, 0)

    }

    handleCollectCarrot(player: any, carrot: any) {
        // hide from display
        this.carrots.killAndHide(carrot)

        // disable from physics world
        this.physics.world.disableBody(carrot.body)
        this.carrotsCollected++
        this.carrotsCollectedText.text = this.carrotsCollected.toString()
    }


    addCarrotAbove(sprite: { y: number; displayHeight: number; x: number | undefined; }) {
        const y = sprite.y - (sprite.displayHeight)

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'carrot')

        // set active and visible
        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)

        // update the physics body size
        carrot.body.setSize(carrot.width, carrot.height)

        this.physics.world.enable(carrot)


        return carrot
    }



    horizontalWrap(sprite: Phaser.Physics.Arcade.Sprite) {
        const halfWidth = sprite.displayWidth * 0.5
        const gameWidth = this.scale.width
        if (sprite.x < -halfWidth) {
            sprite.x = gameWidth + halfWidth
        }
        else if (sprite.x > gameWidth + halfWidth) {
            sprite.x = -halfWidth
        }
    }


    update(t: number, dt: number): void {

        // find out from Arcade Physics if the player's physics body
        // is touching something below it
        const touchingDown = this.player.body?.touching.down

        if (touchingDown) {
            // this makes the bunny jump straight up
            this.player.setVelocityY(-400)
            this.player.setTexture('bunny-jump')
        }

        const vy = this.player.body?.velocity.y || 0
        if (vy > 0 && this.player.texture.key !== 'bunny-stand') {
            // switch back to jump when falling
            this.player.setTexture('bunny-stand')
        }


        // left and right input logic
        if (this.cursors.left.isDown && !touchingDown) {
            this.player.setVelocityX(-200)
        }
        else if (this.cursors.right.isDown && !touchingDown) {
            this.player.setVelocityX(200)
        }
        else {
            // stop movement if not left or right
            this.player.setVelocityX(0)
        }

        this.horizontalWrap(this.player)

        this.platforms.children.iterate((child) => {
            // Explicitly cast 'child' to 'Phaser.Physics.Arcade.Sprite'
            const platform = child as Phaser.Physics.Arcade.Sprite;

            const scrollY = this.cameras.main.scrollY;

            if (platform.y >= scrollY + 700) {
                platform.y = scrollY - Phaser.Math.Between(50, 80);

                // Ensure the physics body is updated
                if (platform.body) {
                    (platform.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
                }

                // Create a carrot above the platform being reused
                if (Phaser.Math.Between(0, 10) > 5){ // Add a bit of luck
                    this.addCarrotAbove(platform);
                }
            }

            return null
        });

        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 200) {
            // console.log("game over")
            this.player.setActive(false)
            this.player.setVisible(false)

            const style = { color: '#000', fontSize: 34 }
            this.add.text(240, 320, 'GAME OVER', style)
                .setScrollFactor(0)
                .setOrigin(0.5, 0)
        }


    }

    findBottomMostPlatform() {
        const platforms = this.platforms.getChildren()
        let bottomPlatform = platforms[0]

        for (let i = 1; i < platforms.length; ++i) {
            const platform = platforms[i]

            // discard any platforms that are above current
            if (platform.y < bottomPlatform.y) {
                continue
            }

            bottomPlatform = platform
        }

        return bottomPlatform
    }

}
