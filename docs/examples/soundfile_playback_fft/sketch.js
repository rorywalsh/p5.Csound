let csound = null;
let isPlaying = false;
let audioCntx = null;
let audioNode = null;
let fft = null;
let colour;
let audioOn, audioOff, audioState=true;
let audioImagePos;

/* RW 2022 */

async function preload() {

  audioOn = loadImage("../audio_on.png");
  audioOff = loadImage("../audio_off.png");

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});

  await Csound.loadAsset("./29704__herbertboland__pianomood5.wav", "piano.wav");

  await csound.evalCode(`
  instr 1
    aL, aR diskin2 "piano.wav", 1, 0, 1
    outs aL, aR
  endin
  `);

  await Csound.startAudio();
  
  audioCntx = await csound.getAudioContext();
  fft = audioCntx.createAnalyser();
  audioNode = await csound.getNode();
  audioNode.connect(fft);

  
}


//create canvas
function setup() {
  createCanvas(windowWidth, windowHeight);
  colour = color("#46B5CB");
  audioImagePos = {x:width-50, y:height-50, w:32, h:32};
}

function draw() {
  background("#374752");
  if (!isPlaying) {
    fill(255);
    textAlign(CENTER);
    text("Click with the mouse to play sample..", width / 2, height / 2);
  } else {

    const freqData = new Uint8Array(fft.frequencyBinCount);
    fft.getByteFrequencyData(freqData);

    noStroke();
    fill(colour);
    for (let i = 0; i < freqData.length; i++) {
      const x = map(i, 0, freqData.length / 4, 0, width);
      const h = -height + map(freqData[i], 0, 255, height, 0);
      rect(x, height, width / freqData.length, h);
    }
  }

  image(audioState ? audioOn : audioOff, audioImagePos.x, audioImagePos.y, audioImagePos.w, audioImagePos.h);
}


async function mousePressed() {
  Csound.resumeAudio();
  if (csound) {
    csound.evalCode(`schedule(1, 0, 10)`); //play sample for 10 seconds
    isPlaying = true;
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
