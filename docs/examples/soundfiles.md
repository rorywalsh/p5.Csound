
## Working with sound files

To work with sound files in p5.Csound we must first load them. Note you must be running a local server in order to work with sound files. The following basic sketch will play a sound file when user's click it. 

[](/soundfile_playback/index.html ':include :type=iframe width=800px height=200px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/soundfile_playback/sketch.js" target="_blank">sketch.js</a>
</p>

As in each of the examples presented here, the Csound instrument is loaded in the `preload()` function. In this case it is a very simple instrument that reads a sound file from disk. Before `csound.evalCode()` is called, the sound file needs to be loaded. To do this, one can call the `Csound.loadAsset()` function.  

```js
async function preload() {

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});

  await Csound.loadAsset("./29704__herbertboland__pianomood5.wav", "piano.wav");

  await csound.evalCode(`
  instr 1
    a1, a2 diskin2 "piano.wav", 1, 0, 1
    outs a1, a2
  endin
  `);

  await csound.start();

}
```

The `Csound.loadAsset()` has the following function prototype:
```js
Csound.loadAsset(fileURL, fileName = "")
```
The first parameter is a string with the full path to the file you wish to load. This file usually resides somewhere on the server. The second parameter is the name the file will be referred to after it has been loaded. In most cases you can jusy pass a single file name, however, in some online IDEs, you must use a unique name for the file that will be passed to Csound. The p5js editor is one such environment where the loaded file cannot have the same name as the original. It seems to have something to do with how certain online environments handle loading of assets. In this case using  shorter names makes life a little simpler. 

Triggering playback of the instrument is trivial, we simply start instrument 1 to play. Because of the parameters we passed to the `diskin2` opcode, it will play on loop for as long as the instrument is running. 

```js
async function mousePressed() {  
  Csound.startAudio();
  if (csound) {
    csound.evalCode(`schedule(1, 0, 10)`); //play sample for 10 seconds
  }
}
```

## Dynamically loading sound files

The previous example worked with a sound file that was located on the server. It is also possible to dynamically load files as shown in the example below. 

[](/soundfile_load/index.html ':include :type=iframe width=800px height=400px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/soundfile_load/sketch.js" target="_blank">sketch.js</a>
</p>

The p5.js function `createFileInput()` can be used to access a file from local storage. Before looking at how that is done, let's first look at the `preload()` function for the above sketch. Instead of reading the contents of the sound file from disk it will be loaded to a function table instead. This provides more control over the sound file playback, and lets us easily sync up a playback scrubber. Here is the `preload()` function.

```js
async function preload() {
    csound = await Csound.create({ options: ["-odac", "--0dbfs=1"] });

    await csound.evalCode(`

  giSoundfile ftgen 1, 0, 2, 2, 0
  
  instr 1

    iLen ftlen giSoundfile
    kIndex init 0
    setksmps 1
    
    aTab tab a(kIndex), giSoundfile
    outs aTab, aTab
    kIndex = kIndex<(iLen-1) ? kIndex+1 : 0    
    chnset kIndex, "sampleIndex"

    kIncomingIndexUpdate chnget "newIndexUpdate"
    if changed(kIncomingIndexUpdate) == 1 then
      kIndex chnget "newIndex"
    endif

    kStop chnget "stop"
    if kStop == 1 then
      turnoff
    endif 

  endin 
  `);

    await csound.start();

    setInterval(async function () {
        currentSample = await csound.getControlChannel("sampleIndex");
    }, 10);
}
```

The first line of Csound code declares a function table. Its size and GEN routine are not important as we will be overwriting its contents with that of the loaded sound file. The instrument itself, when started will begin outputting samples from the loaded sound file. `setksmps 1` is set to ensure our k-rate variables are updating at audio rate. Therefore `kIndex` is our read pointer (note that the same results could be achieved with a `phasor` opcode). Each time `kIndex` is updated, its value is sent to a channel called `"sampleIndex"`. This channel will be used to position the playback scrubber later in the sketch. 

The next section of Csound code listens for changes to a channel called `"newIndexUpdate"`. Whenever its value changes, it queries the `"newIndex"` channel, which will contain the current playback position. (More on this below). The final piece of Csound code listens to channel `"stop"`. Whenever it is 1, the instrument will be terminated. 

Finally, an async function is started, and will be called every 10 milliseconds. Its job is to get the current playhead position, which is stored in the `"sampleIndex"` channel. The `currentSample` variable is then used to position the playback scrubber. Calling `getControlChannel()` on every frame inside your `draw()` can lead to some odd behavior, because the program must wait for the function to return. Using a timed function with `setInterval()` avoids the need to turn the draw function into an async function, and removes an issues with drawing.

The setup function create 2 DOM elements, a button for play/stop and a file input button. The styling of these is done in the corresponding CSS file. Each button is assigned a callback function for when they are pressed. The file input button will trigger the following method when it is pressed.

```js
async function loadSoundfile(obj) {
    if (obj.type === "audio" && obj.subtype == "wav") {
        let ctx = await csound.getAudioContext();
        let c = await ctx.decodeAudioData(await obj.file.arrayBuffer());
        sampleData = await c.getChannelData(0);

        await csound.evalCode(
            "giSoundfile ftgen 1, 0, " + sampleData.length + ", -7, 0, 0"
        );
        await csound.tableCopyIn(1, sampleData);
        await csound.setControlChannel("numSamples", sampleData.length);
        playButton.style("visibility", "visible");
        previousX = 0;
        windowSize = Math.floor(sampleData.length/44100)*20;
    }
}

```

Tje first thing to check is whether or not the user selected a .wav audio file. If so, we access the audioContext Csound is using and use it to decode the `file.arrayBuffer` member of `obj`. `sampleData` is then assigned the samples from channel 0 (note the file player will only output the first channel). After this, we recreate function table 1 (`giSoundfile`), allocating enough samples to hold the contents of channel 1. Once this is done, we can copy the sample data directly to Csound using `csound.tableCopyIn()`. Finally we set the play button to be visible, reset previousX, and set `windowSize` to set the resolution of waveform display. If we try to draw too many points it will slow down our sketch considerably. If we draw too little our waveform will not look good. 


The play button when pressed will trigger the following function:

```js
async function startStopPlayback() {
    if (csound) {
        if (!isPlaying) {
            await csound.setControlChannel("stop", 0);
            csound.evalCode("schedule(1, 0, 999)");
            playButton.html("Press to stop");
            isPlaying = true;
        } else {
            await csound.setControlChannel("stop", 1);
            playButton.html("Press to start");
            isPlaying = false;
        }
    }
}
```

If `isPlaying` is false, we trigger instrument 1 to play for 999 seconds, update the button text and set `isPlaying` to true. When `isPlaying` is true, we set channel `"stop"` to 1 to turn off the instrument. 

The last function of interest is `mouseClicked()`, which will set the playback scrubber to wherever the user clicked. 

```js
async function mousePressed() {
  //exclude mouse clicks on buttons..
  if (mouseY < 360 && mouseX > 0 && mouseX < width) {
      let sampleNum = map(mouseX, 0, width, 0, sampleData.length - 1);
      //hack to ensure a channel changed message is always sent
      await csound.setControlChannel("newIndex", sampleNum);
      await csound.setControlChannel("newIndexUpdate", random(100));
  }
}
```

The initial `mouseY` and `mouseX` check disables clicks if they are off screen, or over the buttons. The `let sampleNum...` line of code simply converts the mouse X position to a sample number. The next two lines of code are a hack to make sure that we get a changed event each and every time the user clicks the waveform. Without these, the user can click the same position but no update event will be registered.  


