<template>
  <div class="Crow">
    <canvas
      ref="canvas"
      class="canvas" />
  </div>
</template>



<script>
import * as PIXI from "pixi.js";

import textureSnake from "../assets/snake.png";
import textureBlob from "../assets/blob.png";
import textureDing from "../assets/ding.png";
import texturePeepis from "../assets/peepis.png";
import textureStick from "../assets/stick.png";
import textureTilde from "../assets/tilde.png";

import gsap, { MotionPathPlugin, PixiPlugin } from "gsap/all";

PixiPlugin.registerPIXI(PIXI);
gsap.registerPlugin(MotionPathPlugin, PixiPlugin);

const lerp = (a, b, t) => a * (1 - t) + b * t;
const angleDifference = (a, b, _d = a - b) => _d + (_d > Math.PI ? -2 * Math.PI : _d < -Math.PI ? 2 * Math.PI : 0);

const JOINT_LENGTH = 14;
const JOINT_LENGTH_MAX = 14;
const JOINT_MAX_ANGLE_MAGNITUDE = Math.PI * 0.065;
const JOINT_LERP_FACTOR = 0.4;
const JOINT_ANGLE_LERP_FACTOR = 0.75;
const TEXTURE_SETTINGS = { resolution: 2 };

export default {
  props: {
    scale: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      mainContainer: null
    };
  },
  watch: {
    scale(nv) {
      this.shapes.scale = new PIXI.Point(nv, nv);
    }
  },
  mounted() {
    const app = new PIXI.Application({
      view: this.$refs.canvas,
      antialias: true,
      transparent: true,
      autoDensity: true,
      resolution: window.devicePixelRatio,
      autoResize: true,
      resizeTo: this.$el,
    });

    const shapes = new PIXI.Container();
    shapes.scale = new PIXI.Point(this.scale, this.scale);
    shapes.sortableChildren = true;
    shapes.position.set(
      this.$refs.canvas.clientWidth / 2 - 12,
      this.$refs.canvas.clientHeight / 2 - 40
    );
    app.stage.addChild(shapes);
    window.addEventListener("resize", () => {
      shapes.position.set(
        this.$refs.canvas.clientWidth / 2 - 12,
        this.$refs.canvas.clientHeight / 2 - 40
      );
    });
    this.mainContainer = shapes;

    const timeline = gsap.timeline();
    // timeline.timeScale(10)
    // gsap.to(timeline, { timeScale: 0.2, duration: 8 });

    const target = new PIXI.Point();
    let pointerOver = false;
    const onPointerLeave = () => {
      pointerOver = false;
      targetController.play();
    };
    const onPointerEnter = () => {
      pointerOver = true;
      targetController.pause();
    };
    this.$el.addEventListener("pointerenter", onPointerEnter);
    this.$el.addEventListener("pointerleave", onPointerLeave);
    const targetController = gsap.to(target, {
      motionPath: {
        path: `M211.7,44C82.7,44,0,142,0,254.5S79.6,466,202.7,466S382.3,391.4,524,293.5c133.1-92,132-130.6,132-183.4
	S597.3,0,536.4,0S410.8,47.7,410.8,116.1s52.2,107.6,86.9,123.3c93.1,42.1,190-16.5,278-16.5c108,0,143,91.1,143,128
	c0,49.5-20.4,115-139,115C639.7,466,535,299.7,383,143.5C329.8,88.8,298.5,44,211.7,44z`,
        offsetX: -480,
        offsetY: -230,
      },
      duration: 9,
      repeat: -1,
      ease: "none",
    });
    const targetTimescaleVariation = gsap.to(targetController, {
      timeScale: 0.8,
      duration: 2,
      repeat: -1,
      yoyoEase: true,
      ease: "sine.inOut",
    });
    // TODO: why does this mess the timing up? Possibly because it overwrites the time scale from timeline?
    // timeline.add(targetController);
    // timeline.add(targetTimescaleVariation);

    //blob
    const blob = new PIXI.Sprite(
      PIXI.Texture.from(textureBlob, TEXTURE_SETTINGS)
    );
    blob.anchor.set(0.5);
    blob.position.set(-286, 0);
    shapes.addChild(blob);
    const blobTween = gsap.to(blob, {
      pixi: {
        positionY: -35,
        rotation: -10,
        scale: 1.02,
      },
      duration: 3.15,
      repeat: -1,
      yoyoEase: true,
      ease: "sine.inOut",
    });
    timeline.add(blobTween);

    //ding
    const ding = new PIXI.Sprite(
      PIXI.Texture.from(textureDing, TEXTURE_SETTINGS)
    );
    ding.anchor.set(0.5);
    ding.position.set(180, 130);
    shapes.addChild(ding);
    const dingTween = gsap.to(ding, {
      keyframes: [
        {
          pixi: { rotation: 120, positionX: 220, positionY: 80 },
          duration: 2,
          ease: "expo.inOut",
          delay: 3,
        },
        {
          pixi: {
            rotation: 240,
          },
          duration: 2.8,
          ease: "expo.inOut",
          delay: 3,
        },
        {
          pixi: { rotation: 360, positionX: 180, positionY: 130 },
          duration: 2.2,
          ease: "expo.inOut",
          delay: 3,
        },
      ],
      repeat: -1,
      repeatDelay: 2,
      delay: 5,
    });
    timeline.add(dingTween);

    //peepis
    const peepis = new PIXI.Sprite(
      PIXI.Texture.from(texturePeepis, TEXTURE_SETTINGS)
    );
    peepis.anchor.set(0.5, 0.65);
    peepis.position.set(326, -20);
    peepis.rotation = -1;
    shapes.addChild(peepis);
    const peepisTween = gsap.to(peepis, {
      pixi: {
        rotation: -2,
        scale: 0.97,
      },
      duration: 4.15,
      repeat: -1,
      repeatDelay: 2,
      yoyoEase: true,
      ease: "expo.inOut",
    });
    timeline.add(peepisTween);

    //stick
    const stick = new PIXI.Sprite(
      PIXI.Texture.from(textureStick, TEXTURE_SETTINGS)
    );
    stick.anchor.set(0.5);
    stick.position.set(-180, 0);
    shapes.addChild(stick);
    const stickTween = gsap.to(stick, {
      pixi: {
        rotation: 2,
        positionX: -205,
        positionY: 15,
        scale: 0.97,
      },
      duration: 1.4,
      yoyoEase: true,
      repeat: -1,
      ease: "expo.inOut",
      delay: 4,
      repeatDelay: 3,
    });
    timeline.add(stickTween);

    //tilde
    const tilde = new PIXI.Sprite(
      PIXI.Texture.from(textureTilde, TEXTURE_SETTINGS)
    );
    tilde.anchor.set(0.5);
    tilde.position.set(45, 220);
    shapes.addChild(tilde);
    const tildeTween = gsap.to(tilde, {
      pixi: {
        rotation: 10,
        positionY: 230,
        scale: 0.9,
      },
      duration: 4.15,
      repeat: -1,
      yoyoEase: true,
      ease: "sine.inOut",
    });
    timeline.add(tildeTween);

    //snake
    const snakePoints = Array.from(
      { length: 100 },
      (_, i) => new PIXI.Point(i * JOINT_LENGTH, 0)
    );
    const snakeHead = new PIXI.Point(0, 0);
    const snakePointsIncludingHead = [...snakePoints, snakeHead];
    const snake = new PIXI.SimpleRope(
      PIXI.Texture.from(textureSnake, TEXTURE_SETTINGS),
      snakePointsIncludingHead
    );
    shapes.addChild(snake);

    //positioning
    [stick, tilde, snake, blob, peepis, ding].forEach((sprite, i) => {
      sprite.zIndex = i + 1;
    });

    //loop
    app.ticker.add(() => {
      if (pointerOver) {
        // override the motion path animation
        const pointerPosition = app.renderer.plugins.interaction.eventData.data.global;
        target.set(
          (pointerPosition.x - shapes.position.x) / this.scale,
          (pointerPosition.y - shapes.position.y) / this.scale
        );
      }

      snakeHead.set(
        lerp(snakeHead.x, target.x, 0.15),
        lerp(snakeHead.y, target.y, 0.15)
      );

      //enforce soft maximum angle magnitude constraints on the joints
      for (let i = snakePointsIncludingHead.length - 3; i >= 0; i--) {
        const last2 = snakePointsIncludingHead[i + 2];
        const last = snakePointsIncludingHead[i + 1];
        const curr = snakePointsIncludingHead[i];

        const currXDiff = curr.x - last.x;
        const currYDiff = curr.y - last.y;
        const lastXDiff = last.x - last2.x;
        const lastYDiff = last.y - last2.y;

        const currLength = Math.sqrt(currXDiff ** 2 + currYDiff ** 2);
        // const lastLength = Math.sqrt(lastXDiff ** 2 + lastYDiff ** 2);

        const currAngle = Math.atan2(currYDiff, currXDiff);
        const lastAngle = Math.atan2(lastYDiff, lastXDiff);

        const jointAngleDifference = angleDifference(currAngle, lastAngle);

        let newAngle;
        if (jointAngleDifference < -JOINT_MAX_ANGLE_MAGNITUDE) {
          newAngle = lastAngle - JOINT_MAX_ANGLE_MAGNITUDE;
        } else if (jointAngleDifference > JOINT_MAX_ANGLE_MAGNITUDE) {
          newAngle = lastAngle + JOINT_MAX_ANGLE_MAGNITUDE;
        } else {
          continue;
        }

        const targetX = last.x + Math.cos(newAngle) * currLength;
        const targetY = last.y + Math.sin(newAngle) * currLength;

        curr.x = lerp(curr.x, targetX, JOINT_ANGLE_LERP_FACTOR);
        curr.y = lerp(curr.y, targetY, JOINT_ANGLE_LERP_FACTOR);
      }

      //force joints to be JOINT_LENGTH apart
      for (let i = snakePointsIncludingHead.length - 2; i >= 0; i--) {
        const last = snakePointsIncludingHead[i + 1];
        const curr = snakePointsIncludingHead[i];

        const xDist = curr.x - last.x;
        const yDist = curr.y - last.y;

        const len = Math.sqrt(xDist ** 2 + yDist ** 2);

        if (len <= JOINT_LENGTH_MAX) {
          const xTarget = last.x + (xDist / len) * JOINT_LENGTH;
          const yTarget = last.y + (yDist / len) * JOINT_LENGTH;

          curr.x = lerp(curr.x, xTarget, JOINT_LERP_FACTOR);
          curr.y = lerp(curr.y, yTarget, JOINT_LERP_FACTOR);
        } else {
          const xNorm = xDist / len;
          const yNorm = yDist / len;

          curr.x = last.x + xNorm * JOINT_LENGTH_MAX;
          curr.y = last.y + yNorm * JOINT_LENGTH_MAX;
        }
      }
    });
  },
};
</script>



<style scoped>
.Crow {
  /* border: solid 1px var(--surface-1); */
  user-select: none;
}
</style>