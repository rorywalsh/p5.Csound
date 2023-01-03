
## Spectral data

Although it is possible to use a number of spectral opcodes in Csound to perform FFT analysis, the Web Audio API provides an easy to use *AnalyserNode* that can be used to simplify the process. This will serve as a good example of how to connect Csound to other web audio nodes. The sketch below loads a sound file and display a real time spectrogram as it is playing. 

[](/soundfile_playback_fft/index.html ':include :type=iframe width=800px height=200px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/soundfile_playback_fft/sketch.js" target="_blank">Link to sketch</a>    <button class="button" onclick="reloadPage()">Reload</button>
</p>


The `preload()` function for this sketch uses a few new Csound functions, and looks like this:

```js
async function preload() {

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});

  await Csound.loadAsset("./pianoMood.wav", "pianoMood.wav");

  await csound.evalCode(`
  instr 1
    a1, a2 diskin2 "pianoMood.wav", 1, 0, 1
    outall(a1, a2)
  endin
  `);

  await Csound.startAudio();
    
  audioCntx = await csound.getAudioContext();
  fft = audioCntx.createAnalyser();
  audioNode = await csound.getNode();
  audioNode.connect(fft);
}
```

After Csound is started, the `audioCntx` var is assigned the audio context Csound created. Then the `fft` var is assigned a new analyser node. Finally, we get the Csound node, and connect it to the fft node. 

The FFT data is accessed on each frame inside the draw() function. 

```js
    let freqData = new Uint8Array(fft.frequencyBinCount);
    fft.getByteFrequencyData(freqData);

    noStroke();
    fill(colour);
    for (let i = 0; i < freqData.length; i++) {
      let x = map(i, 0, freqData.length / 4, 0, width);
      let h = -height + map(freqData[i], 0, 255, height, 0);
      rect(x, height, width / freqData.length, h);
    }
```

Once we have the freq/amp data, it's quite trivial to draw it to the screen. Note that we only display the lower parts of the FFT analysis. This explains the division by 4 in `let x = map(i, 0, freqData.length / 4, 0, width);`.

## Displaying FFT data in a non-traditional way

Once we have access to the FFT data, we can use to it to draw anything we like. In this sketch, stars are placed around the screen. Each star has a frequency associated with it. When there is energy at a given frequency, its corresponding stars will glow brighter. 

[](/fft_stars/index.html ':include :type=iframe width=800px height=400px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/fft_stars/sketch.js" target="_blank">Link to sketch</a>    <button class="button" onclick="reloadPage()">Reload</button>
</p>

The `preload()` function for this sketch is similar to the previous one, but after starting Csound we create our `freqData` array straight away. We then use its size to create the our constellation of stars.    

```js
  freqData = new Uint8Array(fft.frequencyBinCount);
  fft.getByteFrequencyData(freqData);

  for (let i = 0; i < freqData.length; i++) {
    stars.push(new Star(random(width), random(height), random(1, 30)));
  }
  ```

The instrument that plays is a simple generative synth that triggers itself to play a new note at random intervals. This is achieved by scheduling a new note when each note starts. 

```js
  await csound.evalCode(`
  instr 1
    aEnv = linen:a(rnd:i(0.2), p3/2, p3, p3/2)
    aSnd = oscili:a(aEnv, rnd:i(1000))
    outall(aSnd)
    schedule(1, rnd:i(3), 10)
  endin 
  `);
  ```

The size of each star is linked to the amplitude in its frequency bin. In the `draw()` function we iterate over the amp/freq array to update each star's size accordingly.

  ```js
   if (csound && fft != null) {

    let freqData = new Uint8Array(fft.frequencyBinCount);
    fft.getByteFrequencyData(freqData);

    for (let i = 0; i < freqData.length; i++) {
      let x = map(i, 0, freqData.length, -50, width + 50);
      stars[i].size = map(freqData[i], 0, 255, 2, 40);
      stars[i].display();
    }
  }
  ```

The size of the star set its brightness. As the amplitude in each frequency bin changes, so too will the star's size and brightness.  