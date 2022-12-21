let impulseDur = 2;
let balls = [];
let gravity;
let csound = null;
let dragCount = 0;


/* This sketch will play tone each time a ball
bounces off the ground. The amplitude, duration and
frequency are unique to each ball, and each bounce 
RW 2022 */

async function preload() {

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});
  await csound.evalCode(`
  giWavetable ftgen 1, 0, 4096, 10, 1, 1/2, 1/3, 1/4, 1/5, 1/6, 1/7 

  instr 1
    iDecay = p4*.25
    kEnv expon iDecay, p3, 0.001
    aSig oscili kEnv, p5, giWavetable
    aFlt moogladder aSig, p4*10000, .2
    outs aFlt, aFlt
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
  gravity = createVector(0, 0.1);

}

function draw() {
  background("#374752");
  if (csound) {
    if (balls.length == 0) {
      fill(255)
      text("Drag with the mouse..", width / 2, height / 2);
    }
    balls.forEach((ball) => {
      ball.applyForce(gravity);
      ball.update();
      ball.display();
      ball.checkEdges();
    });
  }
  else {
    text("Please wait while Csound loads..", width / 2, height / 2);
  }
}

async function mousePressed(){
  Csound.startAudio();
}

function mouseDragged() {
  if (dragCount % 5 == 0)
    balls.push(new Ball(mouseX, mouseY, random(2, 10)));

  dragCount++;
}

class Ball {
  constructor(x, y, m) {
    this.mass = m;
    this.radius = m * 3;
    this.numBounces = 1;
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.colour = color("#46B5CB");
    this.colour.setAlpha(random(100, 255));
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  display() {
    stroke(1);
    fill(this.colour);
    ellipse(this.position.x, this.position.y, this.radius * 2);
  }

  checkEdges() {
    if (this.position.x > width - this.radius) {
      this.position.x = width - this.radius;
      this.velocity.x *= -1;
    } else if (this.position.x < this.radius) {
      this.position.x = this.radius;
      this.velocity.x *= -1;
    }
    if (this.position.y > height - this.radius) {
      this.position.y = height - this.radius;
      this.velocity.y *= -1;

      //account for loss of speed on impact collisions..
      this.velocity.y *= 1 - this.mass / 20;
      if (this.numBounces < 20) {
        let impulse = map(this.velocity.y, -5, 0, .5, 0);
        let freq = (10 / this.mass) * 400;

        //if Csound has loaded trigger a score event
        if (csound) {
          csound.evalCode(
            `schedule(1, 0, ${impulseDur / this.numBounces}, ${impulse}, ${freq})`
          );
          this.numBounces++;
        }
      }
    }
  }
}
