let csound = null;
let enemies = [];
let isPlaying = false;
let frequency = 200;
let player;
let interval = 500;
let gameOver = false;

/* RW 2022 */

async function preload() {
    csound = await Csound.create({ options: ["-odac", "-iadc", "--0dbfs=1"] });

    await csound.evalCode(`
    instr 1
        a1 inch 1
        a1 tone a1, 500
        kCps, kRms pitchamdf a1, 50, 500
        kCps tonek kCps, 10
        kRms tonek kRms, 10
        if kRms > 0.01 then
            chnset kCps, "freq"
        endif
    endin
    `);

    await csound.start();

    //query the amplitude every 50ms..
    setInterval(async function () {
        frequency = await csound.getControlChannel("freq");
    }, 50);
}

//create canvas
function setup() {
    var cnv = createCanvas(800, 400);
    var x = (windowWidth - width) / 2;
    var y = (windowHeight - height) / 2;
    cnv.position(x, y);
    background("#374752");

    player = new Player();
    setInterval(function () {
        enemies.push(new Enemy(random(width), -50, 30, 20));
    }, interval--);
}

function draw() {
    background("#374752");
    if (csound && isPlaying && !gameOver) {
        enemies.forEach((e) => {
            e.display();
            let distance = e.position.dist(player.position);
            if (distance < 30){
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
}

async function mousePressed() {
    if (!isPlaying) {
        isPlaying = true;
        await csound.evalCode("schedule(1, 0, 9999)");
    }
    else if(gameOver){
        gameOver = false;
    }
}

class Player {
    constructor() {
        this.position = createVector(width / 2 - 10, height - 40);
        this.w = 20;
        this.h = 20;
        this.colour = color("#46B5CB");
    }

    display() {
        fill(this.colour);
        ellipse(this.position.x, this.position.y, this.w, this.h, 5);
        let xPos = map(frequency, 50, 500, 0, width);
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
        rect(this.position.x, this.position.y, this.w, this.h, 5);
        this.position.y++;
    }
}
