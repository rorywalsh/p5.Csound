## Sequencer

The following sketch shows a simple grid based sequencer. The sketch illustrates how to achieve good timing with musical events by using Csound as the main clock. If you try to use JS timer to sequencer music you will inevitably run into issues with timing drift. Therefore it's always best to use Csound as your main clock. 

[](/sequencer/index.html ':include :type=iframe width=800px height=450px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/sequencer/sketch.js" target="_blank">Link to sketch</a>    <button class="button" onclick="reloadPage()">Reload</button>
</p>

This `preload()` function for this sketch looks like this:

```js
async function preload() {
    csound = await Csound.create({options:['-odac', '--0dbfs=1']});

    await csound.evalCode(`

    ifn1 ftgen 1, 0, ${numBeats}, 2, 0
    ifn2 ftgen 2, 0, ${numBeats}, 2, 0
    ifn3 ftgen 3, 0, ${numBeats}, 2, 0
    ifn4 ftgen 4, 0, ${numBeats}, 2, 0
    ifn5 ftgen 5, 0, ${numBeats}, 2, 0
    ifn6 ftgen 6, 0, ${numBeats}, 2, 0
    ifn7 ftgen 7, 0, ${numBeats}, 2, 0
    ifn8 ftgen 8, 0, ${numBeats}, 2, 0

    opcode triggerIfHitEnabled, 0,kii
        kIndex, iTable, iNote xin
        kValue table kIndex, iTable
        kDur chnget "duration"
        kFilterCutoff chnget "filterCutoff"
        if kValue == 1 then
            event "i", 2, 0, kDur, iNote, kFilterCutoff   
        endif
    endop

    instr 1
        iNotes[] fillarray 800, 700, 600, 500, 400, 300, 200, 100 
        kIndex init 0
        kBpm chnget "BPM"

        if chnget:k("play") == 1 then      
            chnset kIndex, "index"
            if metro(kBpm/60) == 1 then
                triggerIfHitEnabled(kIndex, 1, iNotes[0])
                triggerIfHitEnabled(kIndex, 2, iNotes[1])
                triggerIfHitEnabled(kIndex, 3, iNotes[2])
                triggerIfHitEnabled(kIndex, 4, iNotes[3])
                triggerIfHitEnabled(kIndex, 5, iNotes[4])
                triggerIfHitEnabled(kIndex, 6, iNotes[5])
                triggerIfHitEnabled(kIndex, 7, iNotes[6])
                triggerIfHitEnabled(kIndex, 8, iNotes[7])
                kIndex = kIndex < 15 ? kIndex+1 : 0
            endif        
        endif
    endin

    schedule(1, 0, 99999)
    schedule(3, 0, 99999)

    instr 2
        print p3
        kEnv expseg 0.001, 0.01, 1/16, p3, 0.001
        aSig oscili kEnv, p4
        iPan random 0, 1
        aLeft, aRight pan2 aSig, random:i(0, 1)
        chnmix aLeft, "mixL"
        chnmix aRight, "mixR"
        outs aLeft, aRight
    endin

    instr 3
        kFdbk chnget "reverbTime"
        aSigL chnget "mixL"
        aSigR chnget "mixR"
        aL, aR reverbsc aSigL, aSigR, kFdbk, 500
        outs aL, aR
        chnclear "mixL", "mixR"
    endin
  `);

    await csound.start();

    await csound.setControlChannel("BPM", 240);
    await csound.setControlChannel("play", 0);
    await csound.setControlChannel("duration", 0.5);
    await csound.setControlChannel("filterCutoff", 500);

    setInterval(async function(){
        currentPos = await csound.getControlChannel("index");
    }, 10);
}
```

The Csound code begins by creating 8 function tables of `numBeats` size. These correspond to each horizontal track you see in the sequencer. The next section of code creates a simple User Defined Opcode (UDO) that tests if a cell is enabled. If so it will trigger instrument 2 to play. Instrument 2 is a simple sinewave synth, with an exponential envelop and random panning. The synth also outputs a signal to the main reverb instrument which is always running in the background.  

Instrument 1 is the main sequencer instrument and it is running from the moment the sketch loads. The first thing it does is create a table of note values. In this instance, each note is a successive harmonic from the natural harmonic series. It uses a metro to time the events. The BPM comes from the BPM slider, which when moved sends BPM values to a channel called `"BPM"`. On each beat, the index of each table is queried using the `triggerIfHitEnabled` opcode. If a cell is enabled a note it played. 

User interaction with the grid is handled via the `mousePressed()` function.

```js
function mousePressed() {
    Csound.startAudio();
    voices.forEach((v) => v.hitTest(mouseX, mouseY));
    updateCsoundTables();
}
```

`voices` is the array of SequencerVoice objects. The SequencerVoice has a `beatArray` member that holds the current pattern for the track, i.e., `[1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,]`. Whenever a user clicks on the sketch, each SequencerVoice object will have its `hitTest()` function called to see if a cell should be enabled or disabled. After this, the `updateCsoundTables()` function is called. It looks like this:

```js
function updateCsoundTables() {
    voices.forEach(async function (arr, index) {
        await csound.tableCopyIn(index + 1, arr.beatArray);
    });
}
```

As can be seen from the code above, the `csound.tableCopyIn()` function is used to pass each voice's beatArray to its corresponding function table in Csound. This `updateCsoundTables()` function is also called from the `generatePattern()` function, which gets triggered whenever a user hits the *Generate Pattern* button. 

```js
function generatePattern() {
    for (let i = 0; i < numberOfVoices; i++) {
        let phrase = [];
        for (let x = 0; x < numBeats; x++){
            phrase[x] = random(1) > randomWeightSlider.value() ? 0 : 1;
        }
        voices[i].beatArray = phrase;
    }
    updateCsoundTables();
}
```

`randomWeightSlider.value()` is used to weight the probability of a hit on each cell. This a simple way of controlling the likelihood of a hit across each cell. 

Finally, the playback scrubber is updated in the draw function whenever the `"index"` channel is updated in instrument 1. 

