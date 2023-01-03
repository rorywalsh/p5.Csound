let csound = null;
let audioOn, audioOff, audioState = true;
let audioImagePos;
let isPlaying = false;

/* This sketch will trigger a sample to play
whenever the user clicks the sketch 
RW 2022 */

async function preload() {

  audioOn = loadImage("../audio_on.png");
  audioOff = loadImage("../audio_off.png");

  csound = await Csound.create({ worker: true, options: ['-odac', '--0dbfs=1'] });
  print(csound);

  await Csound.loadAsset("./29704__herbertboland__pianomood5.wav", "piano.wav");

  await csound.evalCode(`
  instr 1
    aL, aR diskin2 "piano.wav", 1, 0, 1
    out(aL, aR)
  endin
  `);


  await Csound.startAudio();
}


//create canvas
function setup() {
  var cnv = createCanvas(800, 200);
  const x = (windowWidth - width) / 2;
  const y = (windowHeight - height) / 2;
  cnv.position(x, y);
  audioImagePos = { x: width - 50, y: height - 50, w: 32, h: 32 };
}

function draw() {
  background("#374752");
  fill(255);
  textAlign(CENTER);

  if (csound) {
    text("Click with the mouse to play sample..", width / 2, height / 2);
  }
  else {
    text("Please wait while Csound loads..", width / 2, height / 2);
  }

  image(audioState ? audioOn : audioOff, audioImagePos.x, audioImagePos.y, audioImagePos.w, audioImagePos.h);
}

async function mousePressed() {
  if (mouseX > audioImagePos.x && mouseY > audioImagePos.y &&
    mouseX < audioImagePos.x + audioImagePos.w && mouseY < audioImagePos.y + audioImagePos.h) {
    if (audioState) {
      await csound.pause();
      audioState = false;
    }
    else {
      await csound.resume();
      audioState = true;
    }
  }
  else {
    Csound.resumeAudio();
    if (csound && isPlaying == false) {
      isPlaying = true;
      await csound.evalCode(`schedule(1, 0, 10)`); //play sample for 10 seconds
    }
  }
}
