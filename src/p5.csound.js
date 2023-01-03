
import { Csound } from "@csound/browser";

let csoundObj;

export const create = async (args = {}) => {
  if (csoundObj) {
    print("You cannot create multiple instances of Csound");
    return;
  }

  let inputChannelCount = typeof args.inputChannelCount === "undefined" ? 2 : args.inputChannelCount;
  let outputChannelCount = typeof args.outputChannelCount === "undefined" ? 2 : args.outputChannelCount;
  let worker = typeof args.worker === "undefined" ? false : args.worker;
  let spn = typeof args.spn === "undefined" ? false : args.spn;
  let options = typeof args.options === "undefined" ? [] : args.options;  

  csoundObj = await Csound({
    useWorker: worker,
    useSPN: spn,
    outputChannelCount: outputChannelCount,
    inputChannelCount: inputChannelCount
  });

  //set default 0dbfs
  await csoundObj.setOption("--0dbfs=1");

  options.forEach(async function(o){
     await csoundObj.setOption(o);
     print(o);
  });

  return csoundObj;
};

export const startAudio = async () => {
  const startPromise = csoundObj.start();
  csoundObj.once("onAudioNodeCreated", (ctx) => {
      if (ctx.state === "suspended") {
          ctx.resume();
      }});
  await startPromise;
}

export const resumeAudio = async () => {
  let ctx = await csoundObj.getAudioContext();
  if(ctx.state === "suspended"){
    ctx.resume();
    await csoundObj.start();
  }
}

export const loadAsset = async (fileURL, fileName) => {
  const response = await fetch(fileURL);
  const testSampleArrayBuffer = await response.arrayBuffer();
  await csoundObj.fs.writeFile(fileName, new Uint8Array(testSampleArrayBuffer));
};
