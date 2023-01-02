## Building p5.Csound

To build p5.Csound you should fist ensure you have a current version of Node installed, as well as an active internet connection. Simply clone the repo and run the following command from the repo root dir. 

```bash
npm install
yarn install
yarn build
```


#### Running the examples

All of the examples provided with this project will need some kind of server if you wish to run them locally. VS Code offers a very simple live server extension that is more or less fool proof. Simply install the extension, open an index.html file from any of the example folders, and select to 'run in live server'. 

The other way to run these examples locally is to serve the docs folder. To do this, install [Docsify](https://docsify.js.org/):

```bash
npm i docsify-cli -g
```

Then run:

```bash
docsify serve ./docs
```
This will display a URL that you can then open with a browser. 


<blockquote style="font-size:14px;color:#ddd;background-color:#374752">
Special thanks to <a href="https://github.com/kunstmusik">Steven Yi</a> for providing the esbuild scrip for this project :) 
</blockquote>
