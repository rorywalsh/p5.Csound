
## Audio Input

The following sketch shows how to access live audio input. In this case it is used to trigger an array of balls on the screen.  

[](/audio_input/index.html ':include :type=iframe width=800px height=400px frameBorder=0 scrolling="no"')
<p align="right">
<button onclick="myFunction()">Click me</button>

<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/audio_input/sketch.js" target="_blank">sketch.js</a>
</p>
The `preload()` function looks like this. 

```js
async function preload() {
    csound = await Csound.create({options:['-odac', '-iadc', '--0dbfs=1']});

    await csound.evalCode(`
    instr 1
        a1 inch 1
        chnset rms(a1), "rms"
    endin
    `);

    await csound.start();

    setInterval(async function () {
        amplitude = await csound.getControlChannel("rms");
    }, 50);
}
}
```

In order to request live input we must pass the `-iadc` option when creating Csound. This in turn will cause your browser to request access to the microphone. The Csound instrument couldn't be any simpler. It just accesses the live input from channel 1, and sends its rms value to a channel called `"rms"`. The function triggered by `setInterval` queries the rms value every 50 milliseconds. 

There is a very rudimentary beat detection function included with this example. The code for it shown below:

```js
function detectBeat(level) {
    if (level > threshold) {
        beatLevel = 1;
        for (let i = 0; i < 10; i++) {
            balls.push(
                new Ball(random(0.1, width * 0.1), random(width), height)
            );
        }
    }
    if (beatLevel > 0) beatLevel -= beatLevelDecay;

    return beatLevel;
}
```
As long as the input level is greater than the threshold (0.06), it will push some new Ball objects to screen. It returns a variable that moves from 1 towards, and beyond 0. This is used to add some dynamic changes to the background colour. 


## Scrolling waveforms

The following sketch will display a scrolling waveform in the style of most audio editors. 

[](/audio_input_scrolling/index.html ':include :type=iframe width=800px height=200px frameBorder=0 scrolling="no"')

The `preload()` function for this sketch si almost identical to the one above, only the Csound instrument sends the direct amplitude rather than an RMS amplitude. It also runs with a ksmps size of 1 so we can access those samples directly.

```js
 await csound.evalCode(`
    instr 1
        setksmps 1
        a1 inch 1
        chnset k(a1), "amp"
    endin
    `);
```

The draw function continuously adds the current sample amplitude to the end of an array, while removing the first value. It then iterates over the array and draws a rectangle for each sample. 

```js
function draw() {
    background("#374752");
    if (csound && isPlaying) {

        audioSample.push(amplitude);
        audioSample.splice(0, 1);

        for (var i = 0; i < audioSample.length; i++) {
            var x = map(i, audioSample.length, 0, 0, width);
            var h = map(audioSample[i], 0, 0.5, 1, height);
            strokeWeight(0)
            fill("#46B5CB");
            rect(width - x, height / 2, 1, h);
        }
    } else {
        textAlign(CENTER);
        fill(255);
        text("Press the screen to start", width / 2, height / 2);
    }
}
```

## Accessing pitch data

Csound ships with quite a few pitch detection opcodes. The following sketch uses the `pitchamdf` opcode to track the incoming pitch and uses it to control the players position on screen. Watch out for enemies! 

[](/audio_input_pitch/index.html ':include :type=iframe width=800px height=400px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/audio_input_pitch/sketch.js" target="_blank">sketch.js</a>
</p>

The `preload()` function is not dissimilar to the one presented in the first sketch above.

```js
async function preload() {
    csound = await Csound.create({ options: ["-odac", "-iadc", "--0dbfs=1"] });

    await csound.evalCode(`
    instr 1
        a1 inch 1
        a1 tone a1, 500
        kCps, kRms pitchamdf a1, 50, 500
        kCps tonek kCps, 10
        kRms tonek kRms, 10
        if kRms > 0.01 then
            chnset kCps, "freq"
        endif
    endin
    `);

    await csound.start();

    //query the amplitude every 50ms..
    setInterval(async function () {
        frequency = await csound.getControlChannel("freq");
    }, 50);
}
```

Once again, `-iadc` is passed as a compile time flag to Csound. The instruments uses the `inch` opcode to access the incoming audio, and `pitchamdf` to detect the pitch. A few low-pass filters are used to smoothen out the signal so it's not too jittery. If there is enough amplitude in the signal, the "freq" channel gets updated. Using a test here means the player only moves when the user is singing into the mic.  

Two sliders are provided to tweak the sketch, based on your vocal range and your microphone. Users with higher vocal ranges will probably need to increase the base frequency to make the game easier to play. While those with noisy mics can increase the threshold to avoid noise messing up their input signal. When users move the mic threshold slider it trigger the following callback function, which simply updates the value of the `"MicThreshold"` channel.  

```js
async function changeMicThreshold(){
    await csound.setControlChannel("micThreshold", micThreshold.value());
}
```


