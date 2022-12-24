let noteIndex = 100;
let randomWeightSlider, bpmSlider, playButton, changePatternButton, reverbSlider, durationSlider;
let isPlaying = false;
let voices = [];
let numBeats = 16;
let csound = null;
let pos = 0;
let numberOfVoices = 8;
let currentPos = 0;
let audioOn, audioOff, audioState=true;
let audioImagePos;

/* p5.Csound sequencer example RW 2022 */

async function preload() {

    audioOn = loadImage("../audio_on.png");
    audioOff = loadImage("../audio_off.png");

    csound = await Csound.create({ options: ['-odac', '--0dbfs=1'] });

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
        kIndex init -1
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

    setInterval(async function () {
        currentPos = await csound.getControlChannel("index");
    }, 10);

}

function setup() {
    var cnv = createCanvas(800, 450);
    const x = (windowWidth - width) / 2;
    const y = (windowHeight - height) / 2;
    cnv.position(x, y);

    bpmSlider = createSlider(20, 600, 240, 1);
    bpmSlider.position(x + 410, y + 373);
    bpmSlider.input(changeBPM);
    bpmSlider.addClass("customSliders");

    randomWeightSlider = createSlider(0, 1, 0.25, 0.001);
    randomWeightSlider.position(x + 620, y + 373);
    randomWeightSlider.addClass("customSliders");

    durationSlider = createSlider(0.01, 10, 0.5, 0.001);
    durationSlider.position(x + 410, y + 413);
    durationSlider.input(changeDuration);
    durationSlider.addClass("customSliders");

    reverbSlider = createSlider(0, 1, .6, 0.01);
    reverbSlider.position(x + 620, y + 413);
    reverbSlider.input(changeReverb);
    reverbSlider.addClass("customSliders");

    playButton = createButton("Press to play");
    playButton.style("border-radius", "5px");
    playButton.style("color", color(255));
    playButton.style("background-color", color("#46B5CB"));
    playButton.position(x + 40, y + 360);
    playButton.size(140, 30);
    playButton.mousePressed(startStopPlayback);

    changePatternButton = createButton("Generate Pattern");
    changePatternButton.style("border-radius", "5px");
    changePatternButton.style("color", color(255));
    changePatternButton.style("background-color", color("#46B5CB"));
    changePatternButton.position(x + 190, y + 360);
    changePatternButton.size(140, 30);
    changePatternButton.mousePressed(generatePattern);

    for (let i = 0; i < numberOfVoices; i++)
        voices.push(new SequencerVoice(i, 55, 5 + i * 45, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));

    audioImagePos = {x:width-50, y:height-50, w:32, h:32};
}

function updateCsoundTables() {
    voices.forEach(async function (arr, index) {
        await csound.tableCopyIn(index + 1, arr.beatArray);
    });
}

async function draw() {
    background("#374752");
    stroke(60);
    voices.forEach((v) => v.display());

    fill("#46B5CB");
    text("BPM Slider", 370, 380);
    text("Random Weighting", 560, 380);
    text("Note Duration", 370, 420);
    text("Reverb", 560, 420);
    if (csound && isPlaying) {
        fill("#46B5CB77");
        rect(currentPos * 45 + 50, 3, 40, 350, 5);
    }

    image(audioState ? audioOn : audioOff, audioImagePos.x, audioImagePos.y, audioImagePos.w, audioImagePos.h);
}

async function mousePressed() {
    Csound.startAudio();
    voices.forEach((v) => v.hitTest(mouseX, mouseY));
    updateCsoundTables();

    if (mouseX > audioImagePos.x && mouseY > audioImagePos.y &&
        mouseX < audioImagePos.x + audioImagePos.w && mouseY < audioImagePos.y + audioImagePos.h) {
        if (audioState) {
            await csound.pause();
            audioState = false;
        }
        else {
            await csound.resume();
            print("resuming");
            audioState = true;
        }
    }
}

async function startStopPlayback() {
    if (isPlaying == false) {
        isPlaying = true;
        await csound.setControlChannel("play", 1);
        playButton.html("Press to stop");
    } else {
        isPlaying = false;
        await csound.setControlChannel("play", 0);
        playButton.html("Press to play");
    }
}

async function changeBPM() {
    await csound.setControlChannel("BPM", bpmSlider.value());
}

async function changeDuration() {
    await csound.setControlChannel("duration", durationSlider.value());
}

async function changeReverb() {
    await csound.setControlChannel("reverbTime", reverbSlider.value());
}

function generatePattern() {
    for (let i = 0; i < numberOfVoices; i++) {
        let phrase = [];
        for (let x = 0; x < numBeats; x++) {
            phrase[x] = random(1) > randomWeightSlider.value() ? 0 : 1;
        }
        voices[i].beatArray = phrase;
    }
    updateCsoundTables();
}

function moveScrubber() {
    if (noteIndex < numBeats - 1) {
        noteIndex += 1;
    }
    else {
        noteIndex = 0;
    }
}
