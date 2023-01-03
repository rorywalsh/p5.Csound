let csound = null;
let isPlaying = false;
let audioCntx = null;
let audioNode = null;
let spectrum = null;
let fft = null;
let stars = [];
let audioOn, audioOff, audioState=true;
let audioImagePos;

/* This sketch will trigger a sample to play
whenever the user clicks the sketch 
RW 2022 */

async function preload() {

  audioOn = loadImage("../audio_on.png");
  audioOff = loadImage("../audio_off.png");

  csound = await Csound.create({ options: ['-odac', '--0dbfs=1'] });

  await csound.evalCode(`
  instr 1
    aEnv = linen:a(rnd:i(0.2), p3/2, p3, p3/2)
    aSnd = oscili:a(aEnv, rnd:i(1000))
    outall(aSnd)
    schedule(1, rnd:i(3), 10)
  endin 
  `);

  await Csound.startAudio();

  audioCntx = await csound.getAudioContext();
  fft = audioCntx.createAnalyser();
  audioNode = await csound.getNode();
  audioNode.connect(fft);

  freqData = new Uint8Array(fft.frequencyBinCount);
  fft.getByteFrequencyData(freqData);

  for (const s in freqData) {
    stars.push(new Star(random(width), random(height), random(1, 30)));
  }
}

//create canvas
function setup() {
  var cnv = createCanvas(800, 400);
  const x = (windowWidth - width) / 2;
  const y = (windowHeight - height) / 2;
  cnv.position(x, y);
  audioImagePos = {x:width-50, y:height-50, w:32, h:32};
}

function draw() {
  background("#212121");

  stroke(100, 100, 100);
  if (csound && fft != null) {

    const freqData = new Uint8Array(fft.frequencyBinCount);
    fft.getByteFrequencyData(freqData);

    for (let i = 0; i < freqData.length; i++) {
      const x = map(i, 0, freqData.length, -50, width + 50);
      stars[i].size = map(freqData[i], 0, 255, 2, 40);
      stars[i].display();
    }
  }
  image(audioState ? audioOn : audioOff, audioImagePos.x, audioImagePos.y, audioImagePos.w, audioImagePos.h);
}


async function mousePressed() {
  Csound.resumeAudio();
  if (csound) {
    csound.evalCode(`schedule(1, 0, 10)`);
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

class Star {

  constructor(x, y, s) {
    this.x = x;
    this.y = y;
    this.size = s;
    let l = random(0, 1);
    let c = color("#46B5CB");
    this.colour = color(red(c) * l, green(c) * l, blue(c) * l);
  }

  display() {
    if (this.size < 10)
      strokeWeight(0);
    else
      strokeWeight(1);

    let brightness = map(this.size, 2, 40, .9, 1);

    if (brightness > .4)
      fill(this.colour);
    else
      fill(this.colour * brightness);
      
    ellipse(this.x, this.y, this.size);
  }
}
