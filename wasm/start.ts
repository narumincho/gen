import * as wasm from "./main";

WebAssembly.instantiate(
  wasm.optToWasmBinary({
    functionList: [
      {
        export: { tag: "export", name: "ok28" },
        expr: {
          tag: "I32Add",
          left: { tag: "I32Const", value: 20 },
          right: { tag: "I32Const", value: 8 },
        },
      },
      {
        export: { tag: "export", name: "oneAddOne" },
        expr: {
          tag: "I32Add",
          left: { tag: "I32Const", value: 1 },
          right: { tag: "I32Const", value: 1 },
        },
      },
    ],
  }),
  {}
).then((result) => {
  for (const [name, func] of Object.entries(result.instance.exports)) {
    console.log(name, (func as () => number)());
  }
});
