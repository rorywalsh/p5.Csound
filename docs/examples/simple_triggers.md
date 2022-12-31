
## Simple triggers

The following sketch shows how a Csound instrument can be triggered from on screen events. In this case, collisions with the outer bounds of the sketch. 

[](/simple_triggers/index.html ':include :type=iframe width=800px height=400px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/simple_triggers/sketch.js" target="_blank">Link to sketch</a>    <button class="button" onclick="reloadPage()">Reload</button>
</p>

The Csound instrument is loaded in the `preload()` function. It could be also loaded within the `setup()` function, but it seems cleaner to use `preload()` which gets called before `setup()` 

```js
async function preload() {
    csound = await Csound.create({options:['-odac', '--0dbfs=1']});

    await csound.evalCode(`
instr 1
  iDur = p3
  iAmp = p4
  iFreq = p5;
  aEnv = expon:a(iAmp, iDur, 0.001)
  aSig = oscili:a(aEnv, iFreq)
  outall(aSig)
endin
    `);
  await csound.start();
}
```

The instrument, which produces a sine wave with an exponential decay, is triggered to play each time a collision with the outer bounds of the sketch takes place. `csound.evalCode()` is called from the `display()` function of the Ball class whenever the ball's position moves past left, right, top or bottom of the sketch window.

```js
    if (this.position.x > width || this.position.x < 0) {
      this.direction.x *= -1;
      this.direction.mult(1);
      this.triggerSound();
    }

    if (this.position.y > height || this.position.y < 0) {
      this.direction.y *= -1;
      this.direction.mult(1);
      this.triggerSound();
    }
```

The `triggerSound()` function just wraps the following code, which sets a random frequency each time the function is called. 

```js
  triggerSound() {
    if (csound) {
      let freq = random(1000);
      csound.evalCode(`schedule(1, 0, 5, .1, ${freq})`);
    }
  }
```

> Note that it's a good idea to check that csound is not `null` before calling any Csound library methods. 

The last piece of p5.Csound code in this sketch can be found in the `mouseDragged()` function.
```js
function mouseDragged() {
  Csound.startAudio();
  balls.push(new Ball(mouseX, mouseY));
}
```

When Csound is asked to start, an audio context will be created and told to start running. However, if there are no immediate user interactions with the page for a short time, the browser can mistakenly think that the audioContext was started in error. When this happens it will suspend running of the audio context. `Csound.startAudio()` checks the audioContext, and if it has been suspended asks it to resume. It is not always required, but does provide a simple way of restarting the audio context without having to destroy and recreate your Csound object.