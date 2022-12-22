let csound = null;
let isPlaying = false;
let audioCntx = null;
let audioNode = null;
let fft = null;
let colour;

/* RW 2022 */

async function preload() {

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});

  await Csound.loadAsset("./29704__herbertboland__pianomood5.wav");

  await csound.evalCode(`
  instr 1
    a1, a2 diskin2 "29704__herbertboland__pianomood5.wav", 1, 0, 1
    outs a1, a2
  endin
  `);

  await csound.start();  
  audioCntx = await csound.getAudioContext();
  fft = audioCntx.createAnalyser();
  audioNode = await csound.getNode();
  audioNode.connect(fft);
}


//create canvas
function setup() {
  createCanvas(windowWidth, windowHeight);
  colour = color("#46B5CB");
}

function draw() {
  background("#374752");
  if (!isPlaying) {
    fill(255);
    textAlign(CENTER);
    text("Click with the mouse to play sample..", width / 2, height / 2);
  } else {

    let freqData = new Uint8Array(fft.frequencyBinCount);
    fft.getByteFrequencyData(freqData);

    noStroke();
    fill(colour);
    for (let i = 0; i < freqData.length; i++) {
      let x = map(i, 0, freqData.length / 4, 0, width);
      let h = -height + map(freqData[i], 0, 255, height, 0);
      rect(x, height, width / freqData.length, h);
    }
  }
}


async function mousePressed() {
  Csound.startAudio();
  if (csound) {
    csound.evalCode(`schedule(1, 0, 10)`); //play sample for 10 seconds
    isPlaying = true;
  }
}
