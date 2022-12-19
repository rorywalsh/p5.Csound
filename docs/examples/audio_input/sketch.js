let csound = null;
let balls = [];
let beatLevelDecay = 0.05;
let beatLevel = 0;
let threshold = 0.06;
let amplitude;
let isPlaying = false;

/* RW 2022 */

async function preload() {
    csound = await Csound.create({options:['-odac', '-iadc', '--0dbfs=1']});

    await csound.evalCode(`
    instr 1
        setksmps 1
        a1 inch 1
        chnset rms(a1), "rms"
    endin
    `);

    await csound.start();

    //query the amplitude every 50ms..
    setInterval(async function () {
        amplitude = await csound.getControlChannel("rms");
    }, 50);
}

//create canvas
function setup() {
    var cnv = createCanvas(800, 400);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);
    background("#212121");
}

function draw() {
  background("#212121");
    if (csound && isPlaying) {
        if(amplitude < 0.01)
          background("#212121");
        else
          background(detectBeat(amplitude) * 255);
        strokeWeight(1);
        fill(255);

        for (var i = 0; i < balls.length; i++) {
            var wind = createVector(0.01, 0);
            var gravity = createVector(0, random(0.5) * balls[i].mass);

            var c = 0.03;

            var friction = balls[i].velocity.copy();
            friction.mult(-1);
            friction.normalize();
            friction.mult(c);

            balls[i].applyForce(friction);
            balls[i].applyForce(wind);
            balls[i].applyForce(gravity);
            balls[i].update();
            balls[i].display();
            balls[i].checkEdges();
            //remove balls that go off the bottom of the screen...
            if (balls[i].position.y > height) 
              balls.splice(i, 1);
        }
    } else {
        textAlign(CENTER);
        fill(255);
        text("Press the screen to start", width / 2, height / 2);
    }
}

function detectBeat(level) {
    if (level > threshold) {
        beatLevel = 1;
        for (let i = 0; i < 10; i++) {
            balls.push(
                new Ball(random(0.1, width * 0.1), random(width), height)
            );
        }
    }
    if (beatLevel > 0) beatLevel -= beatLevelDecay;

    return beatLevel;
}

async function mousePressed() {
  isPlaying = true;
  await csound.evalCode("schedule(1, 0, 9999)");
}

//based on Shiffman's nature of code examples
class Ball {
    constructor(m, x, y) {
        this.mass = m;
        this.position = createVector(x, y);
        this.velocity = createVector(0, -random(4, 20));
        this.acceleration = createVector(0, 0);
        this.colour = color('#46B5CB');
        this.colour.setAlpha(random(10, 255));
    }

    applyForce(force) {
        var f = p5.Vector.div(force, this.mass);
        this.acceleration.add(f);
        //this.position.x += random(-5, 5);
    }

    update() {
        this.velocity.add(this.acceleration);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
    }

    display() {
        noStroke();
        fill(this.colour);
        ellipse(this.position.x, this.position.y, this.mass, this.mass);
    }

    checkEdges() {
        if (this.position.x > width) {
            this.position.x = width;
            this.velocity.x *= -1;
        } else if (this.position.x < 0) {
            this.velocity.x *= -1;
            this.position.x = 0;
        }
    }
}
