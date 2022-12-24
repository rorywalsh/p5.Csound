let csound = null;
let isPlaying = false;
let currentSample = 0;
let sampleData = [];
let previousY = 0;
let previousX = 0;
let playButton;
let loadButton;
let windowSize = 1;
let audioOn, audioOff, audioState=true;
let audioImagePos;

/* This sketch will trigger a sample to play
whenever the user clicks the sketch 
RW 2022 */

async function preload() {

    audioOn = loadImage("../audio_on.png");
    audioOff = loadImage("../audio_off.png");

    csound = await Csound.create({ options: ["-odac", "--0dbfs=1"] });

    await csound.evalCode(`

  giSoundfile = ftgen(1, 0, 2, 2, 0)
  
  instr 1
    prints("Sample playback started")
    iLen = ftlen(giSoundfile)
    kIndex init 0
    setksmps 1
    
    aTab = table:a(a(kIndex), giSoundfile)
    outall(aTab)
    kIndex = kIndex%(iLen-1) + 1    
    chnset(kIndex, "sampleIndex")

    kIncomingIndexUpdate = chnget:k("newIndexUpdate")
    if changed(kIncomingIndexUpdate) == 1 then
      kIndex = chnget("newIndex")
    endif

    kStop = chnget:k("stop")
    if kStop == 1 then
      turnoff
    endif 

  endin 
  `);

    await csound.start();

    setInterval(async () => {
        currentSample = await csound.getControlChannel("sampleIndex");
    }, 10);

}

//create canvas
function setup() {
    var cnv = createCanvas(800, 400);
    const x = (windowWidth - width) / 2;
    const y = (windowHeight - height) / 2;
    cnv.position(x, y);

    background("#374752");

    loadButton = createFileInput(loadSoundfile);
    loadButton.addClass("custom-file-upload");
    loadButton.position(x + 20, y + 360);
    loadButton.size(140, 30);
    loadButton.mousePressed(loadSoundfile);

    playButton = createButton("Press to start");
    playButton.style("border-radius", "5px");
    playButton.style("color", color(255));
    playButton.style("visibility", "hidden");
    playButton.style("background-color", color("#46B5CB"));
    playButton.position(x + 160, y + 360);
    playButton.size(140, 30);
    playButton.mousePressed(startStopPlayback);

    audioImagePos = {x:width-50, y:height-50, w:32, h:32};
}

function draw() {
    background("#374752");
    if (csound && sampleData.length > 0) {
        previousY = sampleData[0];
        
        for (let i = 0; i < sampleData.length; i+=windowSize) {
            let x = map(i, 0, sampleData.length-1, 0, width);
            let y = map(sampleData[i], -1, 1, 0, height);
            stroke("#374752");
            strokeWeight(1);
            line(x, 0, x, height);
            stroke("#46B5CB");
            line(previousX, previousY, x, y);
            previousX = x;
            previousY = y;
        }

        let scrubberX = map(currentSample, 0, sampleData.length, 0, width);
        strokeWeight(1);
        stroke(255);
        line(scrubberX, 0, scrubberX, height);
    }
    else{
      fill(255);
      textAlign(CENTER);
      text("Wave files only..", width/2, height/2)
    }

    image(audioState ? audioOn : audioOff, audioImagePos.x, audioImagePos.y, audioImagePos.w, audioImagePos.h);
}

async function mousePressed() {
  //exclude mouse clicks on buttons..
  if (mouseY < 360 && mouseX > 0 && mouseX < width) {
      const sampleNum = map(mouseX, 0, width, 0, sampleData.length - 1);
      //hack to ensure a channel changed message is always sent
      await csound.setControlChannel("newIndex", sampleNum);
      await csound.setControlChannel("newIndexUpdate", random(100));
  }

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

async function loadSoundfile(obj) {
    if (obj.type === "audio" && obj.subtype == "wav") {
        const ctx = await csound.getAudioContext();
        const c = await ctx.decodeAudioData(await obj.file.arrayBuffer());
        sampleData = await c.getChannelData(0);
        windowSize = Math.floor(sampleData.length/44100)*20;

        await csound.evalCode(
            "giSoundfile ftgen 1, 0, " + sampleData.length + ", -7, 0, 0"
        );
        await csound.tableCopyIn(1, sampleData);
        await csound.setControlChannel("numSamples", sampleData.length);
        playButton.style("visibility", "visible");
        previousX = 0;
    }
}
