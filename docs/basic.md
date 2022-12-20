## Basic overview

The only file you need in order to use p5.Csound is p5.csound.js. This bundles the p5.Csound wrapper, and the WASM build of Csound into a single JS file. If you wish to build the library yourself, see the building page. Otherwise just use the prebuilt version in the downloads page. Once you have the library, you need only include that file in your sketches index.html:

```
<body>
  <main>
  </main>
  <script src="path/to/p5.csound.js"></script>
  <script src="sketch.js"></script>
</body>
```

With that done, you can create an instance of Csound using the `Csound.create()` method. Almost all of Csound's function are marked as `async`. This mean you will need to mark some p5 functions as `async` too. For example, if we load Csound in the `p5.preload()` function, we need to mark is as `async`.

```js
async function preload() {
  csound = await Csound.create({options:['-odac', '--0dbfs=1']});
}
```

The `Csound.create()` returns a Csound object, and is passed an optional object with the following optional arguments:

* inputChannelCount : sets the number of input channels, defaults to `2`
* outputChannelCount : sets the number of output channels, defaults to `2`
* spn : set to `true` to explicitly request ScriptProcessorNode rather than AudioWorklet, default to `false`
* worker: set to `true` to use backend using Web Workers to run Csound in a thread separate from audio callback, defaults to `false`
* options: an array of Csound options, similar to those you would see in the <CsOptions></CsOptions> of a typical .csd file

> Note that 0dbfs is set to 1 by default, but can be overrode with the `--0dbfs=N` option. 

Only one Csound object can be created per script. Once you have created the core `csound` object, you can compile some Csound code using the `csound.evalCode()` function. Although you can compile entire Csound files, the examples presented here all use `csound.evalCode()` to compile Csound code when it is needed. The following code will compile instrument 1. 

```js
    await csound.evalCode(`
    instr 1
    kEnv madsr .1, .2, .8, .4
    a1 oscili kEnv, random(100, 1000)
    outs a1, a1
    endin
    `);
```

With some code compiled you can call csound.start() to start a Csound performance. The full preload function might look like this.

```js
async function preload() {
    csound = await Csound.create({options:['-odac', '--0dbfs=1']});

    await csound.evalCode(`
    instr 1
    kEnv madsr .1, .2, .8, .4
    a1 oscili kEnv, random(100, 1000)
    outs a1, a1
    endin
    `);

    await csound.start();
}
```

The csound.evalCode() function can also be used to trigger instances of n instrument by calling the `schedule` opcode. We can for instance trigger this instrument to play from a `mousePressed()` function.

```js
async function mousePressed(){
    startTime = 0
    instrument = 1
    duration = 5
    await csound.evalCode(`schedule(${instrument}, ${startTime}, ${duration})`);
}
```


