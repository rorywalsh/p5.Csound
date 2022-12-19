let csound = null;
let isPlaying = false;
let audioCntx = null;
let audioNode = null;
let fft = null;
let colour;

/* This sketch will trigger a sample to play
whenever the user clicks the sketch 
RW 2022 */

async function preload() {

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});

  await Csound.loadAsset("./pianoMood.wav", "pianoMood.wav");

  await csound.evalCode(`
  instr 1
    a1, a2 diskin2 "pianoMood.wav", 1, 0, 1
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
  background("#212121");
  if (!isPlaying) {
    fill(255);
    textAlign(CENTER);
    text("Click with the mouse to play sample..", width / 2, height / 2);
  } else {

    let freqData = new Uint8Array(fft.frequencyBinCount);
    fft.getByteFrequencyData(freqData);

    noStroke();


    for (let i = 0; i < freqData.length; i++) {
      let x = map(i, 0, freqData.length / 2, 0, width);
      let h = -height + map(freqData[i], 0, 255, height, 0);
      colour.setAlpha(200)
      fill(colour);
      rect(x, height, width / freqData.length, h * .6);
      colour.setAlpha(175)
      fill(colour);
      rect(x, height, width / freqData.length, h * .3);
      colour.setAlpha(150)
      fill(colour);
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
