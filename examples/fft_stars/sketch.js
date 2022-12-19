let csound = null;
let isPlaying = false;
let audioCntx = null;
let audioNode = null;
let spectrum = null;
let fft = null;
let stars = [];

/* This sketch will trigger a sample to play
whenever the user clicks the sketch 
RW 2022 */

async function preload() {

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});

  await csound.evalCode(`
  giWavetable ftgen 1, 0, 4096, 10, 1, 0, 1/3, 0, 1/5, 0, 1/7 

  instr 1
    aEnv linen rnd(0.2), p3/2, p3, p3/2
    a1 oscili aEnv, rnd(1000), giWavetable
    outs a1, a1
    schedule(1, rnd(3), 10)
  endin
  `);


  await csound.start();
  
  audioCntx = await csound.getAudioContext();
  fft = audioCntx.createAnalyser();
  audioNode = await csound.getNode();
  audioNode.connect(fft);

  freqData = new Uint8Array(fft.frequencyBinCount);
  fft.getByteFrequencyData(freqData);

  for (let i = 0; i < freqData.length; i++) {
    stars.push(new Star(random(-50, width+50), random(height), random(1, 30)));
  }
}


//create canvas
function setup() {
  var cnv = createCanvas(800, 400);
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  cnv.position(x, y);
}

function draw() {
  background("#212121");

  stroke(100, 100, 100);
  if (csound && fft != null) {

    let freqData = new Uint8Array(fft.frequencyBinCount);
    fft.getByteFrequencyData(freqData);

    for (let i = 0; i < freqData.length; i++) {
      let x = map(i, 0, freqData.length, -50, width+50);
      stars[i].size = map(freqData[i], 0, 255, 2, 40);
      stars[i].display(map(freqData[i], 0, 255, 0.9, 1));
    }
  }

}


function mousePressed() {
  Csound.startAudio();
  if (csound) {
    csound.evalCode(`schedule(1, 0, 10)`);
    isPlaying = true;
  }
}

class Star {

  constructor(x, y, s) {
    this.x = x;
    this.y = y;
    this.size = s;
    let l = random(0, 1);
    let c = color("#46B5CB");
    this.colour = color(red(c)*l, green(c)*l, blue(c)*l);
    // this.colour.setAlpha(random(100, 255));
  }

  display(brightness) {
    if (brightness > .4)
      fill(this.colour);
    else
      fill(this.colour * brightness);
    ellipse(this.x, this.y, this.size);

    this.x = this.x > width+50 ? -10 : this.x+0.1;

  }
}