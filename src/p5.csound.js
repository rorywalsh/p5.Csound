
import { Csound } from "@csound/browser";

let csoundObj;

export const create = async (args = {}) => {
  if (csoundObj) {
    print("You cannot create multiple instances of Csound");
    return;
  }

  let inputChannelCount = typeof args.inputChannelCount === "undefined" ? 2 : args.inputChannelCount;
  let outputChannelCount = typeof args.outputChannelCount === "undefined" ? 2 : args.outputChannelCount;
  let zerodbfs = typeof args.zerodbfs === "undefined" ? 1 : args.zerodbfs;
  let messageLevel = typeof args.messageLevel === "undefined" ? '-m0d' : args.messageLevel;
  let samplingRate = typeof args.samplingRate === "undefined" ? 44100 : args.samplingRate;

  csoundObj = await Csound({
    useWorker: false,
    useSPN: false,
    outputChannelCount: outputChannelCount,
    inputChannelCount: inputChannelCount
  });


  await csoundObj.setOption("--0dbfs=" + zerodbfs);
  await csoundObj.setOption("-odac");
  await csoundObj.setOption(messageLevel);
  await csoundObj.setOption("--sample-rate=" + samplingRate);


  return csoundObj;
};

export const startAudio = async () => {
  let ctx = await csound.getAudioContext();
  ctx.resume();
  await csound.start();
}

export const start = async () => {
  const startPromise = csoundObj.start();
  csoundObj.once("onAudioNodeCreated", (ctx) => {
      if (ctx.state === "suspended") {
          ctx.resume();
      }});
  await startPromise;
}

export const loadAsset = async (fileURL, fileName) => {
  const response = await fetch(fileURL);
  const testSampleArrayBuffer = await response.arrayBuffer();
  await csoundObj.fs.writeFile(fileName, new Uint8Array(testSampleArrayBuffer));
};
