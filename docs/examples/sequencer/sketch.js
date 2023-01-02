let noteIndex = 100;
let randomWeightSlider, bpmSlider, playButton, changePatternButton, reverbSlider, durationSlider;
let isPlaying = false;
let voices = [];
let numBeats = 16;
let csound = null;
let pos = 0;
let numberOfVoices = 8;
let currentPos = 0;
let audioOn, audioOff, audioState = true;
let audioImagePos;

/* p5.Csound sequencer example RW 2022 */

async function preload() {

    audioOn = loadImage("../audio_on.png");
    audioOff = loadImage("../audio_off.png");

    csound = await Csound.create({ options: ['-odac', '--0dbfs=1'] });

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
            chnset(kIndex, "index")
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

    await csound.start();

    await csound.setControlChannel("BPM", 240);
    await csound.setControlChannel("play", 0);
    await csound.setControlChannel("duration", 0.5);
    await csound.setControlChannel("filterCutoff", 500);

    let getIndex = setInterval(async function () {
        currentPos = await csound.getControlChannel("index");
    }, 10);

    csound.on("stop", () => clearInterval(getIndex));

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

    audioImagePos = { x: width - 50, y: height - 50, w: 32, h: 32 };
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