let csound = null;
let balls = [];

/* This sketch will play a random tone whenever 
any of the balls hit the side of the sketch 
RW 2022 */

async function preload() {

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
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  cnv.position(x, y);
  background("#374752");
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
    text("Please wait while Csound loads..", width / 2, height / 2);
  }

  for (let i = 0; i < balls.length; i++) {
    balls[i].display();
  }
}

function mouseDragged() {
  Csound.startAudio();
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
      let freq = random(1000);
      csound.evalCode(`schedule(1, 0, 5, .1, ${freq})`);
    }
  }
}
