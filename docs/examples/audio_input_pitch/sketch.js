import { Csound } from "@csound/browser";

let csound = null;
let enemies = [];
let isPlaying = false;
let frequency = 200;
let player;
let interval = 500;
let gameOver = false;
let baseFreq = 100;
let freqRange, micThreshold;
let audioOn, audioOff, audioState = true;
let audioImagePos;

/* RW 2022 */

async function preload() {

    audioOn = loadImage("../audio_on.png");
    audioOff = loadImage("../audio_off.png");

    csound = await Csound.create({ options: ["-odac", "-iadc", "--0dbfs=1"] });

    await csound.evalCode(`
    instr 1
        aIn = inch(1)
        aIn = tone(aIn, 500)
        kCps, kRms pitchamdf aIn, 50, 1000
        kCps = tonek(kCps, 10)
        kRms = tonek(kRms, 10)
        kThreshold = chnget:k("micThreshold")
        if kRms > kThreshold then
            chnset(kCps, "freq")
        endif
    endin
    `);

    await csound.start();
    await csound.setControlChannel("micThreshold", 0.2);


    let getFreq = setInterval(async () => {
        frequency = await csound.getControlChannel("freq");
    }, 50);

    csound.on("stop", () => clearInterval(getFreq));
}

//create canvas
function setup() {
    var cnv = createCanvas(800, 400);
    const x = (windowWidth - width) / 2;
    const y = (windowHeight - height) / 2;
    cnv.position(x, y);
    background("#374752");

    micThreshold = createSlider(0.001, 1, 0.1, 0.001);
    micThreshold.position(x + 90, y + 384);
    micThreshold.input(changeMicThreshold);
    micThreshold.addClass("customSliders");

    freqRange = createSlider(50, 500, 100, 1);
    freqRange.position(x + 278, y + 384);
    freqRange.addClass("customSliders");

    player = new Player();
    setInterval(() => {
        if (isPlaying && !gameOver) {
            enemies.push(new Enemy(random(width), -50, 30, 20));
        }
    }, interval--);

    audioImagePos = {x:width-50, y:height-50, w:32, h:32};
}

async function changeMicThreshold() {
    await csound.setControlChannel("micThreshold", micThreshold.value());
}

function draw() {
    background("#374752");
    fill(255)
    text("Mic Threshold", 50, 390);
    text("Base frequency", 230, 390);

    if (csound && isPlaying && !gameOver) {
        enemies.forEach((e) => {
            e.display();
            const distance = e.position.dist(player.position);
            if (distance < 30) {
                gameOver = true;
                enemies = [];
            }
            if (e.position.y > height) enemies.splice(1, enemies.indexOf(e));
        });

        player.display();
    } else {
        textAlign(CENTER);
        fill(255);
        text("Game Over. Press the screen to start", width / 2, height / 2);
    }

    image(audioState ? audioOn : audioOff, audioImagePos.x, audioImagePos.y, audioImagePos.w, audioImagePos.h);
}


async function mousePressed() {
    Csound.startAudio();
    if (!isPlaying) {
        isPlaying = true;
        await csound.evalCode("schedule(1, 0, 9999)");
    }
    else if (gameOver) {
        gameOver = false;
    }

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

class Player {
    constructor() {
        this.position = createVector(width / 2 - 10, height - 60);
        this.w = 40;
        this.colour = color("#46B5CB");
    }

    display() {
        fill(this.colour);
        stroke(255);
        ellipse(this.position.x, this.position.y, this.w);
        const xPos = map(frequency, freqRange.value(), 300, 0, width);
        this.position.x = xPos;
    }
}

class Enemy {
    constructor(x, y, w, h) {
        this.position = createVector(x, y);
        this.w = w;
        this.h = h;
        this.colour = color("#46B5CB");
        this.colour.setAlpha(random(50, 100));
    }

    display() {
        fill(this.colour);
        stroke(0);
        rect(this.position.x, this.position.y, this.w, this.h, 5);
        this.position.y++;
    }
}
