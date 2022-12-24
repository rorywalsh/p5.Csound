let csound = null;
let balls = [];
let isPlaying = false;
let audioOn, audioOff, audioState=true;
let audioImagePos;

/* This sketch will play a random tone whenever 
any of the balls hit the side of the sketch 
RW 2022 */

async function preload() {
  audioOn = loadImage("../audio_on.png");
  audioOff = loadImage("../audio_off.png");

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});

  await csound.evalCode(`
instr 1
  iDur = p3
  iAmp = p4
  iFreq = p5;
  aEnv expon iAmp, iDur, 0.001
  aSig oscil aEnv, iFreq
  outs aSig, aSig
endin
`);

  await csound.start();
  
}

//create canvas
function setup() {
  var cnv = createCanvas(800, 400);
  const x = (windowWidth - width) / 2;
  const y = (windowHeight - height) / 2;
  cnv.position(x, y);
  background("#374752");
  audioImagePos = {x:width-50, y:height-50, w:32, h:32};

}

function draw() {
  background("#374752");
  fill(255);

  if (csound) {
    if (balls.length == 0){
      textAlign(CENTER);
      text("Drag and release with the mouse..", width / 2, height / 2);
    }
  }
  else {
    textAlign(CENTER);
    text("Please wait while Csound loads..", width / 2, height / 2);
  }

  balls.forEach( ball => {
    ball.display();
  });


  image(audioState ? audioOn : audioOff, audioImagePos.x, audioImagePos.y, audioImagePos.w, audioImagePos.h);
}

async function mousePressed(){
  if(mouseX > audioImagePos.x && mouseY > audioImagePos.y &&
    mouseX < audioImagePos.x+audioImagePos.w && mouseY < audioImagePos.y+audioImagePos.h){
      if(audioState){
        await csound.pause();
        audioState = false;
      }
      else{
        await csound.resume();
        print("resuming");
        audioState = true;
      }
   }
}

function mouseDragged() {
  Csound.startAudio();
  isPlaying = true;
  balls.push(new Ball(mouseX, mouseY));
}

class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.position = createVector(x, y);
    this.direction = createVector(random(-2, 2), random(-2, 2));
    this.colour = color("#46B5CB");
    this.colour.setAlpha(random(100, 255));
    this.size = random(10, 40);
  }

  display() {
    fill(this.colour);
    ellipse(this.position.x, this.position.y, this.size);
    this.position.x += this.direction.x;
    this.position.y += this.direction.y;
    if (this.position.x > width || this.position.x < 0) {
      this.direction.x *= -1;
      this.direction.mult(1);
      this.triggerSound();
    }

    if (this.position.y > height || this.position.y < 0) {
      this.direction.y *= -1;
      this.direction.mult(1);
      this.triggerSound();
    }
  }

  triggerSound() {
    if (csound) {
      const freq = random(1000);
      csound.evalCode(`schedule(1, 0, 5, .1, ${freq})`);
    }
  }
}
