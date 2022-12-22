let csound = null;
var audioSample = new Array(1000);
let amplitude;
let isPlaying = false;

/* RW 2022 */

async function preload() {
    csound = await Csound.create({ options: ['-odac', '-iadc', '--0dbfs=1'] });

    await csound.evalCode(`
    instr 1
        setksmps 1
        a1 inch 1
        chnset k(a1), "amp"
    endin
    `);

    await csound.start();

    //query the amplitude every 50ms..
    setInterval(async function () {
        amplitude = await csound.getControlChannel("amp");
    }, 10);
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
    background("#374752");
    if (csound && isPlaying) {
        // add new level to end of array
        audioSample.push(amplitude);

        // remove first item in array
        audioSample.splice(0, 1);

        // loop through all the previous levels
        for (var i = 0; i < audioSample.length; i++) {
            //maps x index according to number of samples in array
            //saves us from having to calculate the x-spacing
            var x = map(i, audioSample.length, 0, 0, width);
            //get a height level for each sample
            var h = map(audioSample[i], 0, 0.5, 1, height);

            strokeWeight(0)
            fill("#46B5CB");
            rect(width - x, height / 2, 1, h);
        }
    } else {
        textAlign(CENTER);
        fill(255);
        text("Press the screen to start", width / 2, height / 2);
    }
}

async function mousePressed() {
    Csound.startAudio()
    isPlaying = true;
    await csound.evalCode("schedule(1, 0, 9999)");
}
