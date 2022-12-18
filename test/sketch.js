let csound = null;
let isPlaying = false;

async function preload() {
  csound = await CSOUND.loadCsound();
  await CSOUND.loadCsoundAsset("./pianoMood.wav", "pianoMood1.wav");
  
  await csound.evalCode(`
  instr 1
    a1, a2 diskin2 "pianoMood1.wav", 1, 0, 1
    outs a1, a2
  endin
  `);
  
  await csound.start();
  
}

//create canvas
function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background("#222");
  if (!isPlaying) {
    fill(255);
    textAlign(CENTER);
    text("Click with the mouse to play sample..", width / 2, height / 2);
  } 
}

function mousePressed() {
  if(csound){
  csound.evalCode(`schedule(1, 0, 3)`);
  isPlaying = true;
  }
}
