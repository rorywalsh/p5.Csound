## Table Synth

The following sketch contains a generative pad synth that morphs between 4 different tables. The display highlights the current table index as it moves randomly between states. 

[](/pad_synth/index.html ':include :type=iframe width=800px height=400px frameBorder=0 scrolling="no"')
<p align="right">
<a href="https://github.com/rorywalsh/p5.Csound/blob/master/docs/examples/pad_synth/sketch.js" target="_blank">Link to sketch</a>    <button class="button" onclick="reloadPage()">Reload</button>
</p>

The preload function features the usual code to start Csound, but the Csound instrument in this instance is a little more involved than in earlier sketches. It can roughly be divided into two sections. One is concerned with preparing data for the sketch to display, the other concerns the sounds the synth produces.

The opening lines of code creates the 4 wave tables the synth morphs between. The synth uses the `ftmorf` opcode to morph between tables 1 to 4 which it does randomly for the duration of each note. As it morphs between the tables, it writes new table data to table 10, i.e, `giWavetable`. Table 100, `giTableIndices` holds the number of each of the table `ftmorf` will morph through. 

```js
    giTableIndices ftgen 100, 0, 4, -2, 1, 2, 3, 4
    giWavetable ftgen 10, 0, 4096, 10, 1
    giWave1 ftgen 1, 0, 4096, 10, 1, .5, .25, .017, 0.01
    giWave2 ftgen 2, 0, 4096, 10, 1, 1, 1, 1, 1, 1
    giWave3 ftgen 3, 0, 4096, 10, 1, 0, .25, 0, 0.01
    giWave4 ftgen 4, 0, 4096, 10, 0, 0.5, .75, 0.5,  .1, 0, 0.1
```

The next block of code creates 100 function additional function tables. These tables are for display purposes only. 

```js
    ;the next 100 tables are only for display purposes
    iCnt = 0
    while iCnt < 100 do
        giMorphedTable ftgen 200+iCnt, 0, 4096, 10, 1
        iCnt +=1
    od
```

The above tables are filled with transitional table data by the following recursive instrument which is triggered when the sketch first loads. As `kIndex` moves between 0 and 3 (we are morphing between 4 tables) we write the transitional table to one of the tables created above. At the end of the recursion, each of the 100 display tables contains a table that lies somewhere between one of the 4 wave shapes used by the synth. 

```js
    instr MorphedTables
        if p4 < 100 then
            kIndex = 1+divz(p4, 100, 0)*3
            ftmorf kIndex, giTableIndices, 200+p4
            schedule("MorphedTables", 0, .1, p4+1)
        endif
    endin
```

The `TableManager` instrument which is always running, is shown below.

```js
    instr TableManager
        kIndex jspline 3, 0.1, 0.5
        ftmorf abs(kIndex), giTableIndices, giWavetable
        chnset abs(kIndex), "currentIndex"
    endin
```

It serves two purposes. The first is to morph between the 4 wave tables and write transitional table data to the `giWavetable` table. Its second function is to send the current index to p5.js, where it will be used to highlight the current table within the array of 100 on-screen tables.

Instrument 1 is the main synth instrument, and is shown below. This synth takes a fairy standard approach to generating a pad sound. It features 3 different oscillators. Each oscillator, which morphs between several tables, is tuned slightly differently to add space and movement to the sound.

```js
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
```

The detuning, like the morphing, is not constant but evolves over time. Finally, the output of the 3 oscillators are summed and passed through a low-pass filter, a panner, and then through a local reverb. 

The final line triggers the next note, which will be given a frequency and duration from a fixed set of values defined in iNote[] and iDurs[].  

