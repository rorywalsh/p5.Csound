## Sequencer

The following sketch shows a simple grid based sequencer. The sketch illustrates how to achieve good timing with musical events by using Csound as the main clock. If you try to use JS timers to sequencer music you will inevitably run into issues with timing drift. Therefore it is always best to use Csound as your main clock. 

[](/sequencer/index.html ':include :type=iframe width=800px height=450px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/sequencer/sketch.js" target="_blank">Link to sketch</a>    <button class="button" onclick="reloadPage()">Reload</button>
</p>

This `preload()` function for this sketch looks like this:

```js
async function preload() {
    csound = await Csound.create({options:['-odac', '--0dbfs=1']});

    await csound.evalCode(`

   ;create tables 1-9
	indx = 1
	while indx < 9 do
		ifn = ftgen(indx, 0, ${numBeats}, 2, 0)
		indx += 1
	od

    giNotes[] = fillarray(800, 700, 600, 500, 400, 300, 200, 100)

    opcode triggerIfHitEnabled, 0,ki
        kIndex, iTable xin
        kValue = table:k(kIndex, iTable)
        kDur = chnget:k("duration")
        kFilterCutoff = chnget:k("filterCutoff")
        if kValue == 1 then
            schedulek(2, 0, kDur, giNotes[iTable-1], kFilterCutoff)
        endif
        if iTable > 1 then
	        triggerIfHitEnabled(kIndex,iTable-1)
        endif
    endop

    instr 1
        kIndex init -1
        kBpm = chnget:k("BPM")
        if chnget:k("play") == 1 then      
            chnset:k(kIndex, "index")
            if metro(kBpm/60) == 1 then
                triggerIfHitEnabled(kIndex, 8)
                kIndex = kIndex < 15 ? kIndex+1 : 0
            endif      
        endif
    endin

    schedule(1, 0, 99999)
    schedule(3, 0, 99999)

    instr 2
        kEnv = expseg:k(0.001, 0.01, 1/16, p3, 0.001)
        aSig = oscili:a(kEnv, p4)
        aLeft, aRight pan2 aSig, random:i(0, 1)
        chnmix aLeft, "mixL"
        chnmix aRight, "mixR"
        out(aLeft, aRight)
    endin

    instr 3
        kFdbk = chnget:k("reverbTime")
        aSigL = chnget:a("mixL")
        aSigR = chnget:a("mixR")
        aL, aR reverbsc aSigL, aSigR, kFdbk, 500
        out(aL, aR)
        chnclear "mixL", "mixR"
    endin
  `);

    await Csound.startAudio();

    await csound.setControlChannel("BPM", 240);
    await csound.setControlChannel("play", 0);
    await csound.setControlChannel("duration", 0.5);
    await csound.setControlChannel("filterCutoff", 500);

    let getIndex = setInterval(async function () {
        currentPos = await csound.getControlChannel("index");
    }, 10);

    csound.on("stop", () => clearInterval(getIndex));

}
```

The Csound code begins by creating 8 function tables of `numBeats` size. These correspond to each horizontal track you see in the sequencer. The next section of code creates a simple User Defined Opcode (UDO) that tests if a cell is enabled. If so it will trigger instrument 2 to play. The UDO is recursive. Every time it is called it will in turn call itself 8 times, once for each table. Instrument 2 is a simple sine wave synth, with an exponential envelop and random panning. The synth also outputs a signal to the main reverb instrument which is always running in the background.  

Instrument 1 is the main sequencer instrument and it is running from the moment the sketch loads. The first thing it does is create a table of note values. In this instance, each note is a successive harmonic from the natural harmonic series. It uses a metro to time the events. The BPM comes from the BPM slider, which when moved sends BPM values to a channel called `"BPM"`. On each beat, the index of each table is queried using the `triggerIfHitEnabled` opcode. If a cell is enabled a note is played. 

User interaction with the grid is handled via the `mousePressed()` function.

```js
function mousePressed() {
    Csound.resumeAudio();
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

