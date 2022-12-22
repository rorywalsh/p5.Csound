let csound = null;
let isPlaying = false;
let numTables = 100;
let tables = [];
let currentIndex = 0;


/* p5.Csound pad and waterfall type display. RW 2022 */


async function preload() {

  csound = await Csound.create({options:['-odac', '--0dbfs=1']});

  await csound.evalCode(`
    ;the following tables are used to allow morphing between timbres
    giTableIndices ftgen 100, 0, 4, -2, 1, 2, 3, 4
    giWavetable ftgen 10, 0, 4096, 10, 1
    giWave1 ftgen 1, 0, 4096, 10, 1, .5, .25, .017, 0.01
    giWave2 ftgen 2, 0, 4096, 10, 1, 1, 1, 1, 1, 1
    giWave3 ftgen 3, 0, 4096, 10, 1, 0, .25, 0, 0.01
    giWave4 ftgen 4, 0, 4096, 10, 0, 0.5, .75, 0.5,  .1, 0, 0.1

    ;the next 100 tables are only for display purposes
    iCnt = 0
    while iCnt < 100 do
        giMorphedTable ftgen 200+iCnt, 0, 4096, 10, 1
        iCnt +=1
    od

    ;simple generative synth which calls itself recursively. 
    instr 1
        iNotes[] fillarray 48, 60, 67, 65, 62, 53 
        iDurs[] fillarray 2, 2.5, 3, 4
        kArp[] fillarray 5, 7, -5, 0
        kEnv = madsr(1, .2, .9, 1)
        iAmp = random(0.2, 0.4)
        kDetune jspline .01, 0.1, .3
        a1 oscili (iAmp*kEnv)/3, cpsmidinn(iNotes[p4]), giWavetable
        a2 oscili (iAmp*kEnv)/3, cpsmidinn(iNotes[p4])*1+kDetune, giWavetable
        a3 oscili (iAmp*kEnv)/3, cpsmidinn(iNotes[p4])/2, giWavetable

        aMix = a1+a2+a3
        aMix lpf18 aMix, 1000, abs(kDetune)*10, 0.0
        aL, aR pan2 aMix, abs(jspline:k(1, .1, .2))
        aRevL, aRevR reverbsc aL, aR, .99, 1000 
        outs aRevL*kEnv, aRevR*kEnv
        schedule(1, p3-1, iDurs[random(0, 4)], int(random(0, 5)))
    endin
    
    ;this instrument is always running, and constantly updates the wavetable
    ;it also notifies our sketch about the index of the current table
    instr TableManager
        kIndex jspline 3, 0.1, 0.5
        ftmorf abs(kIndex), giTableIndices, giWavetable
        chnset abs(kIndex), "currentIndex"
    endin

    schedule("TableManager", 0, 99999)

    ;this instrument is called only once, and generates 100 transitional display tables  
    instr MorphedTables
        if p4 < 100 then
            kIndex = 1+divz(p4, 100, 0)*3
            ftmorf kIndex, giTableIndices, 200+p4
            schedule("MorphedTables", 0, .1, p4+1)
        endif
    endin
    
    schedule("MorphedTables", 0, 0.1)
    `);

    await csound.setControlChannel("tableIndex", 1);
    await csound.start();  

    //set to run 20 times a second. a JS timer is fine here because it's
    //only for display purposes 
    setInterval(async function(){
        currentIndex = Math.floor(map(await csound.getControlChannel("currentIndex"), 0, 3, 0, numTables-1)); 
    }, 50);
}

//create canvas
async function setup() {
  var cnv = createCanvas(800, 400);
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  cnv.position(x, y);
}

function draw() {
  background("#374752");

  if (csound && isPlaying) {
    tables.forEach(t => t.display(currentIndex));
  }
  else {
    textAlign(CENTER);
    fill(255)
    text("Press the screen to start", width / 2, height / 2);
  }

}

//first time a user presses the screen we copy the contents of the 100
//transitional tables, and create new instances of the Table class
async function mousePressed() {
  if(!isPlaying){
    for( let i = 0 ; i < numTables ; i++){
        let data = await csound.tableCopyOut(200+i);
        tables.push(new Table(50+(Math.pow(3, 2+(i/50))), (height*.6)-i, 700-(i*3), 100, i, data));
    }
    //start the main synth
    await csound.evalCode("schedule(1, 0, 3, 1)");
    isPlaying = true;
  }
}

//Table class that draws a wave shape based on the data passed to it
class Table{
    constructor(x, y, w, h, index, data){
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.c = color('#46B5CB');
        this.c.setAlpha(20);
        this.index = index;
        this.sampleData = data; 
        this.previousY = 0;
        this.previousX = 0;
        this.alphaFade = 0;
    }

    //iterate over the contents of the tables and draw their wave shape
    display(activeTable){
        this.previousY = map(this.sampleData[0], -1, 1, this.y, this.y+this.h);
        this.previousX = this.x;
        for ( let i = 1 ; i < this.sampleData.length ; i+=20){
            let x = map(i, 0, this.sampleData.length-1, this.x, this.x+this.w);
            let y = map(this.sampleData[i], -1, 1, this.y, this.y+this.h);
            strokeWeight(activeTable===this.index ? 3 : 1);
            
            if(activeTable === this.index){
                this.alphaFade = 200;
            }
            this.c.setAlpha(Math.max(10, this.alphaFade-=0.05));
            stroke(activeTable === this.index ? color('#46B5CB') : (this.alphaFade>10 ? this.c : color(255, 40)));
            line(this.previousX, this.previousY, x, y);
            this.previousX = x;
            this.previousY = y;
        }
    }
}