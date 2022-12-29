let csound = null;
let balls = [];
let beatLevelDecay = 0.01;
let beatLevel = 0;
let threshold = 0.2;
let amplitude;
let isPlaying = false;
let audioOn, audioOff, audioState = true;
let audioImagePos;

/* RW 2022 */

async function preload() {
    
    audioOn = loadImage("../audio_on.png");
    audioOff = loadImage("../audio_off.png");

    csound = await Csound.create({ options: ['-odac', '-iadc', '--0dbfs=1'] });

    await csound.evalCode(`
    instr 1
        aIn = inch(1)
        chnset(rms(aIn), "rms")
    endin
    `);

    await csound.start();

    //query the amplitude every 50ms..
    let getRMS = setInterval(async function () {
        amplitude = await csound.getControlChannel("rms");
    }, 50);

    csound.on("stop", () => clearInterval(getRMS));
}

//create canvas
function setup() {
    var cnv = createCanvas(800, 400);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);
    background("#212121");
    audioImagePos = {x:width-50, y:height-50, w:32, h:32};
}

function draw() {
    background("#374752");
    if (csound && isPlaying) {
        if (amplitude < 0.01)
            background("#374752");
        else {
            detectLevel(amplitude);
        }

        strokeWeight(1);
        fill(255);

        for (var i = 0; i < balls.length; i++) {
            const wind = createVector(0.01, 0);
            const gravity = createVector(0, random(0.5) * balls[i].mass);

            const c = 0.03;

            const friction = balls[i].velocity.copy();
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

    image(audioState ? audioOn : audioOff, audioImagePos.x, audioImagePos.y, audioImagePos.w, audioImagePos.h);
}

function detectLevel(level) {
    if (level > threshold) {
        beatLevel = 1;
        for (let i = 0; i < 10; i++) {
            balls.push(
                new Ball(random(0.1, width * 0.1), random(width), height)
            );
        }
    }
}

async function mousePressed() {
    Csound.startAudio()

    if (!isPlaying)
        await csound.evalCode("schedule(1, 0, 9999)");

    isPlaying = true;

    if (mouseX > audioImagePos.x && mouseY > audioImagePos.y &&
        mouseX < audioImagePos.x + audioImagePos.w && mouseY < audioImagePos.y + audioImagePos.h) {
        if (audioState) {
            await csound.pause();
            audioState = false;
        }
        else {
            await csound.resume();
            print("resuming");
            audioState = true;
        }
    }
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
