let csound = null;
let isPlaying = false;
let sampleData = [];
let previousY = 0;
let previousX = 0;
let playButton;
let loadButton;
let waveform;

/* This sketch will trigger a sample to play
whenever the user clicks the sketch 
RW 2022 */

async function preload() {

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});

  await csound.evalCode(`

  giSoundfile ftgen 1, 0, 2, 2, 0
  
  instr 1
    ;iFreq = sr/ftlen(giSoundfile)
    ;aPhs phasor iFreq
    kNumSamples chnget "numSamples"
    kIndex init 0
    setksmps 1
    
    if chnget:k("play") == 1 then
      aTab tab a(kIndex), giSoundfile
      outs aTab, aTab
      chnset kIndex, "sampleIndex"  
      kIndex = kIndex<(kNumSamples-1) ? kIndex+1 : 0
      printk2 kIndex
      printk 1, ftlen(giSoundfile)
    endif

  endin 

  schedule(1, 0, 10000)
  `);

  await csound.start();
  await csound.setControlChannel("play", 0);
}


//create canvas
function setup() {
  var cnv = createCanvas(800, 400);
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  cnv.position(x, y);
  waveform = createGraphics(width, height);
  waveform.clear();
  background("#000000");

  loadButton = createFileInput(loadSoundfile);
  loadButton.addClass("custom-file-upload")
  loadButton.position(x+20, y+360);
  loadButton.size(140, 30);
  loadButton.mousePressed(loadSoundfile);

  playButton = createButton("Play");
  playButton.style("border-radius", "5px");
  playButton.style("color", color(255));
  playButton.style("background-color", color("#46B5CB"));
  playButton.position(x+160, y+360);
  playButton.size(140, 30);
  playButton.mousePressed(startStopPlayback);
}

async function draw(){
  if(csound && sampleData.length>0){
    let currentSample = await csound.getControlChannel("sampleIndex");
    let scrubberX = map(currentSample, 0, sampleData.length, 0, width);
    fill('white');
    strokeWeight(1);
    rect(scrubberX, 0, 2, height);
  }

  image(waveform, 0, 0);
}


async function drawWaveform() {
  waveform.textAlign(CENTER);
  waveform.fill(255)
  waveform.strokeWeight(0);

  if (csound && sampleData.length>0) {
    
    previousY = sampleData[0];
    for ( let i = 1 ; i < sampleData.length ; i+=10){
      let x = map(i, 0, sampleData.length-1, 0, width);
      let y = map(sampleData[i], -1, 1, 0, height);
      waveform.stroke("#212121");
      waveform.strokeWeight(1)
      line(x, 0, x, height);
      waveform.stroke("#46B5CB");

      waveform.line(previousX, previousY, x, y);
      previousX = x;
      previousY = y;
    }
  }
}

async function startStopPlayback(){
  if (csound) {
    if(isPlaying){
      await csound.setControlChannel('play', 0);
      isPlaying = false;
    }
    else{
      await csound.setControlChannel('play', 1);
      isPlaying = true;
    }   
  }
}

async function loadSoundfile(obj){
  if(obj.type === 'audio'){
    const b = new Uint16Array(await obj.file.arrayBuffer());
    let ctx = await csound.getAudioContext();
    let c = await ctx.decodeAudioData(await obj.file.arrayBuffer());
    sampleData = await c.getChannelData(0);
     
    await csound.evalCode("giSoundfile ftgen 1, 0, "+sampleData.length+", -7, 0, 0");
    await csound.tableCopyIn(1, sampleData);  
    await csound.setControlChannel("numSamples", sampleData.length) 
    drawWaveform();
  }
}

