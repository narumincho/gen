/**
 * WASM_BINARY_MAGIC
 *
 * magic_cookie
 *
 * https://github.com/sunfishcode/wasm-reference-manual/blob/master/WebAssembly.md#module-contents
 */
export const wasmBinaryMagic: ReadonlyArray<number> = [0x00, 0x61, 0x73, 0x6d];

/**
 * WASM_BINARY_VERSION
 *
 * version
 *
 * https://github.com/sunfishcode/wasm-reference-manual/blob/master/WebAssembly.md#module-contents
 */
const wasmBinaryVersion: ReadonlyArray<number> = [0x01, 0x00, 0x00, 0x00];

/**
 * 使われる型の組み合わせを指定する
 * https://github.com/sunfishcode/wasm-reference-manual/blob/master/WebAssembly.md#type-section
 */

const typeSection = (): ReadonlyArray<number> => {
  const numberOfType: ReadonlyArray<number> = [1];

  /**
   * とりあえず ():i32 だけ
   */
  const body: ReadonlyArray<number> = [0x60, 0x00, 0x01, 0x7f];

  const length: number = numberOfType.length + body.length;
  return [0x01, ...uInt32ToBinary(length), ...numberOfType, ...body];
};

/**
 * 関数の型をTypeSectionで指定した番号で指定する
 * https://github.com/sunfishcode/wasm-reference-manual/blob/master/WebAssembly.md#function-section
 */
const functionSection = (numberOfFunction: number): ReadonlyArray<number> => {
  const numberOfFunctionBinary = [numberOfFunction];

  /**
   * とりあえず, すべての関数の型はTypeSectionで指定した0番にしよう
   */
  const body = new Array(numberOfFunction).fill(0x00);

  const length = numberOfFunctionBinary.length + body.length;

  return [0x03, ...uInt32ToBinary(length), ...numberOfFunctionBinary, ...body];
};

/**
 * エキスポートする関数を指定する
 *
 * https://github.com/sunfishcode/wasm-reference-manual/blob/master/WebAssembly.md#export-section
 */
const exportSection = (numberOfFunction: number): ReadonlyArray<number> => {
  const numberOfFunctionBinary = [numberOfFunction];

  const body = new Array(numberOfFunction)
    .fill(0)
    .flatMap((index) => exportFunctionName(index));

  const length = numberOfFunctionBinary.length + body.length;

  return [0x07, ...uInt32ToBinary(length), ...numberOfFunctionBinary, ...body];
};

const exportFunctionName = (index: number): ReadonlyArray<number> => {
  const digitList: ReadonlyArray<number> = [...`output_${index}`].map(
    (char) => char.codePointAt(0) as number
  );
  return [
    digitList.length,
    ...digitList,
    // 文字の終わり示す
    0x00,
    // エキスポートする関数の番号
    index,
  ];
};

/**
 * それぞれの関数の中身をしていする
 *
 * https://github.com/sunfishcode/wasm-reference-manual/blob/master/WebAssembly.md#code-section
 */
const codeSection = (
  codeList: ReadonlyArray<ReadonlyArray<number>>
): ReadonlyArray<number> => {
  const numberOfFunctionBinary = [codeList.length];

  /**
   *  TODO 雑な実装 これでちゃんと複数の定義に対応できているのか?
   */
  const body = codeList.flat();

  const length = numberOfFunctionBinary.length + body.length;
  return [0x0a, ...uInt32ToBinary(length), ...numberOfFunctionBinary, ...body];
};
/**
 * 1番左のビットをONにする
 * ```
 * 010101011
 * ↓
 * 110101011
 * ```
 */
const onLeftBit = (value: number): number => {
  return value | 0b10000000;
};

/**
 * 右端から数えて場所から7bit分を取得する
 * ```
 * 101010101011
 * ↓ offset 2
 *    0101010
 * ```
 */
const get7Bits = (value: number, offset: number): number => {
  return (value >> offset) & 0b1111111;
};

/**
 * 8bit を表示する. デバッグ用
 */
const byteToString = (value: number): string => {
  return value.toString(2).padStart(8, "0");
};

/**
 * https://github.com/sunfishcode/wasm-reference-manual/blob/master/WebAssembly.md#primitive-encoding-types"
 *
 * 符号付き32bit整数1byte ～ 5 byteの可変長のバイナリに変換する
 */
const int32ToBinary = (x: number): ReadonlyArray<number> => {
  /** 0~6 ビット目 */
  const b0 = get7Bits(x, 0);
  /** 7~13 ビット目 */
  const b1 = get7Bits(x, 7);
  /** 14~20 ビット目 */
  const b2 = get7Bits(x, 14);
  /** 21~27 ビット目 */
  const b3 = get7Bits(x, 21);
  /** 28~31 ビット目. (32~34bitは常にON) */
  const b4 = get7Bits(x, 28) | 0b01110000;

  if (-(2 ** 6) <= x && x <= 2 ** 6 - 1) {
    return [b0];
  }
  if (-(2 ** 13) <= x && x <= 2 ** 13 - 1) {
    return [onLeftBit(b0), b1];
  }
  if (-(2 ** 20) <= x && x <= 2 ** 20 - 1) {
    return [onLeftBit(b0), onLeftBit(b1), b2];
  }

  if (-(2 ** 27) <= x && x <= 2 ** 27 - 1) {
    return [onLeftBit(b0), onLeftBit(b1), onLeftBit(b2), b3];
  }

  return [onLeftBit(b0), onLeftBit(b1), onLeftBit(b2), onLeftBit(b3), b4];
};

/**
 * https://github.com/sunfishcode/wasm-reference-manual/blob/master/WebAssembly.md#primitive-encoding-types
 *
 * 符号なし32bit整数を1byte ～ 5 byteの可変長のバイナリに変換する
 */
const uInt32ToBinary = (x: number): ReadonlyArray<number> => {
  /** 0~6 ビット目 */
  const b0 = get7Bits(x, 0);
  /** 7~13 ビット目 */
  const b1 = get7Bits(x, 7);
  /** 14~20 ビット目 */
  const b2 = get7Bits(x, 14);
  /** 21~27 ビット目 */
  const b3 = get7Bits(x, 21);
  /** 28~31 ビット目. (32~34bitは常にOFF) */
  const b4 = get7Bits(x, 28);

  if (b1 === 0 && b2 === 0 && b3 === 0 && b4 === 0) {
    return [b0];
  }
  if (b2 === 0 && b3 === 0 && b4 === 0) {
    return [onLeftBit(b0), b1];
  }
  if (b3 === 0 && b4 === 0) {
    return [onLeftBit(b0), onLeftBit(b1), b2];
  }

  if (b4 === 0) {
    return [onLeftBit(b0), onLeftBit(b1), onLeftBit(b2), b3];
  }

  return [onLeftBit(b0), onLeftBit(b1), onLeftBit(b2), onLeftBit(b3), b4];
};

type WatLike =
  | { tag: "I32Const"; value: number }
  | { tag: "Call"; functionIndex: number }
  | { tag: "I32Add" }
  | { tag: "I32Sub" }
  | { tag: "I32Mul" };

type Opt =
  | { tag: "I32Add"; left: Opt; right: Opt }
  | { tag: "I32Sub"; left: Opt; right: Opt }
  | { tag: "I32Mul"; left: Opt; right: Opt }
  | { tag: "I32Const"; value: number }
  | { tag: "Call"; functionIdex: number };

const optToBinary = (opt: Opt): ReadonlyArray<number> => {
  const binary = [
    0x00,
    ...optToWatLikeList(opt).flatMap(watLikeToBinary),
    0x0b,
  ];

  return [...uInt32ToBinary(binary.length), ...binary];
};

const optToWatLikeList = (opt: Opt): ReadonlyArray<WatLike> => {
  switch (opt.tag) {
    case "I32Add":
      return [
        ...optToWatLikeList(opt.left),
        ...optToWatLikeList(opt.right),
        { tag: "I32Add" },
      ];
    case "I32Sub":
      return [
        ...optToWatLikeList(opt.left),
        ...optToWatLikeList(opt.right),
        { tag: "I32Sub" },
      ];
    case "I32Mul":
      return [
        ...optToWatLikeList(opt.left),
        ...optToWatLikeList(opt.right),
        { tag: "I32Mul" },
      ];
    case "I32Const":
      return [{ tag: "I32Const", value: opt.value }];
    case "Call":
      return [{ tag: "Call", functionIndex: opt.functionIdex }];
  }
};

const watLikeToBinary = (watLike: WatLike): ReadonlyArray<number> => {
  switch (watLike.tag) {
    case "I32Const":
      return [0x41, ...uInt32ToBinary(watLike.value)];
    case "Call":
      return [0x10, ...uInt32ToBinary(watLike.functionIndex)];
    case "I32Add":
      return [0x6a];
    case "I32Sub":
      return [0x6b];
    case "I32Mul":
      return [0x6c];
  }
};

export const optToWasmBinary = (optList: ReadonlyArray<Opt>): Uint8Array => {
  return new Uint8Array([
    ...wasmBinaryMagic,
    ...wasmBinaryVersion,
    ...typeSection(),
    ...functionSection(1),
    ...exportSection(1),
    ...codeSection(optList.map(optToBinary)),
  ]);
};
