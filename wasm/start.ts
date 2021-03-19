import * as wasm from "./main";

WebAssembly.instantiate(
  wasm.optToWasmBinary([
    {
      tag: "I32Add",
      left: { tag: "I32Const", value: 20 },
      right: { tag: "I32Const", value: 8 },
    },
  ]),
  {}
).then((result) => {
  for (const [name, func] of Object.entries(result.instance.exports)) {
    console.log(name, (func as () => void)());
  }
});
