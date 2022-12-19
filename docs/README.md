## p5.Csound

p5.Csound is a lightweight wrapper to the web assembly build of Csound. It provides all the power of Csound inside p5 sketches. With over a thousand processing opcodes, it is one of the most extensive audio processing libraries available in a browser. This interface provide very little in the way of wrapper functions. In fact, it only provides two; one for loading Csound, and the other for loading assets. After that, everything is accessible through the core Csound object. 

Note this project would not be possible without the efforts of <font color="cornflowerblue">Steven Yi</font>, <font color="cornflowerblue">Hlöðver Sigurðsson</font> and numerous other Csound developers. More details on their work can be found on the main Csound github repository. The documentation for the WASM build of Csound can be found [here](https://github.com/csound/csound/tree/master/wasm/browser). 

Note that the examples presented here assume some prior knowledge of Csound. If you have no previous experience with Csound, it might be worth taking a look at the Csound FLOSS manual, which provide interactive learning examples via the browser. The floss manual can be found [here](https://flossmanual.csound.com/).  

  