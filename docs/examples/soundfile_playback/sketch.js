let csound = null;


/* This sketch will trigger a sample to play
whenever the user clicks the sketch 
RW 2022 */

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

}


//create canvas
function setup() {
  var cnv = createCanvas(800, 400);
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  cnv.position(x, y);
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
}

async function mousePressed() {  
  Csound.startAudio();
  if (csound) {
    csound.evalCode(`schedule(1, 0, 10)`); //play sample for 10 seconds
  }
}
