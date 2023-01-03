
## Dynamic events

The following sketch shows how a Csound instrument can be fed information from events within the sketch in order to provide a stronger connection between what is seen on screen, and what is heard.  

[](/dynamic_events/index.html ':include :type=iframe width=800px height=400px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/dynamic_events/sketch.js" target="_blank">Link to sketch</a>    <button class="button" onclick="reloadPage()">Reload</button>
</p>

Once again, the Csound instrument is loaded in the `preload()` function. It's a simple subtractive synth, that wil be fed duration, amplitude, frequency and filter cutoff values from the sketch when an event takes place. 

```js
async function preload() {

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});
  await csound.evalCode(`
  giWavetable = ftgen(1, 0, 4096, 10, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7)
  instr 1
    iDecay = p4*.25
    kEnv = expon:k(iDecay, p3, 0.001)
    aSig = oscili:a(kEnv, p5, giWavetable)
    aFlt = moogladder(aSig, p4*10000, .2)
    outall(aFlt)
  endin
  `);

  await Csound.startAudio();
}
```

The Csound instrument is triggered whenever a ball lands on the floor of the sketch. `this` in the context below is one of the balls.  

```js
if (this.position.y > height - this.radius) {
      this.position.y = height - this.radius;
      this.velocity.y *= -1;

      //account for loss of speed on impact collisions..
      this.velocity.y *= 1 - this.mass / 20;
      if (this.numBounces < 20) {
        let impulse = map(this.velocity.y, -5, 0, .5, 0);
        let freq = (10 / this.mass) * 400;

        if (csound) {
          csound.evalCode(
            `schedule(1, 0, ${impulseDur / this.numBounces}, ${impulse}, ${freq})`
          );
          this.numBounces++;
        }
      }
    }
```

The frequency of the sound each ball makes is determined by its mass. The smaller the ball, the higher in pitch it will sound when it bounces. The duration of each note will decrease on each bounce thanks to the duration being set as `impuleDur / this.numBounces`. Finally, the `impulse` var is used to determine how much filtering takes place on each bounce. As the ball loses more and more energy, the higher end of the spectrum becomes less and less prominent. 