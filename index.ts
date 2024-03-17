const fraction = ["角", "分"];

const digit = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];

// 大单位
const unit = [
  "", // 10^0
  "万", // 10^4
  "亿", // 10^8
  "兆", // 10^12
  "京", // 10^16
  "垓", // 10^20
  "秭", // 10^24
  "穰", // 10^28
  "沟", // 10^32
  "涧", // 10^36
  "正", // 10^40
  "载", // 10^44
  "极", // 10^48
  "恒河沙", // 10^52
  "阿僧祗", // 10^56
  "那由他", // 10^60
  "不可思议", // 10^64
  "无量", // 10^68
  "大数", // 巨大数目
];

// 局部单位
const unitl = ["", "拾", "佰", "仟"];

interface DivResult {
  quotient: number;
  remainder: number;
}

interface LocalResult {
  num: number;
  numHan: string;
  unit: string;
}

interface Thunk {
  localResult: LocalResult[];
  unit: string;
  unitId: number;
  localStack: LocalResult[];
  localValue: number;
  unSpell?: boolean;
}

interface DecimalThunk {
  num: number;
  numHan: string;
  unit: string;
  unitId: number;
}

// 整数获取各个单位上的值形成一个堆
function getDiv10Stack(int: number) {
  const stacks: DivResult[] = [];
  const base = 10;

  let number = int;
  while (true) {
    const quotient = Math.floor(number / base);
    const remainder = number % base;

    stacks.push({ quotient, remainder });

    if (quotient == 0) break;
    number = quotient;
  }
  return stacks;
}

// 数组分块
function splitArray<T>(array: T[], chunkSize: number) {
  let result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

function first<T>(arr: T[]) {
  return arr[0];
}

function last<T>(arr: T[]) {
  return arr[arr.length - 1];
}

function trimZeroLocal(locals: LocalResult[]) {
  const localStack: LocalResult[] = [];
  for (let i = 0; i < locals.length; i++) {
    const local = locals[i];

    const top = last(localStack);
    if (top?.num === 0 && local.num === 0) continue;

    localStack.push(local);
  }

  while (localStack.length > 0) {
    if (first(localStack).num !== 0) break;
    // if (localStack.length <= 1) break;
    localStack.shift();
  }

  while (localStack.length > 0) {
    if (last(localStack).num !== 0) break;
    // if (localStack.length <= 1) break;
    localStack.pop();
  }

  // console.log(thunk);
  // console.log("localstack:", localStack);
  return localStack;
}

function spell(localStack: LocalResult[]) {
  let words;
  if (localStack.length === 0) {
    words = digit[0];
  } else {
    words = localStack
      .map((e) => {
        return e.num !== 0 ? `${e.numHan}${e.unit}` : `${e.numHan}`;
      })
      .reverse()
      .join("");
  }
  return words;
}

function parseIntegerPart(integerPart: number) {
  // 整数部分各个单位的值堆栈
  const divStacks = getDiv10Stack(integerPart);
  console.log(divStacks);

  // 将整个数字拆分到对应的大单位上
  const divThunks = splitArray(divStacks, 4);
  console.log(divThunks);

  const thunkStack: Thunk[] = [];

  // 针对每个trunk进行处理
  for (let i = 0; i < divThunks.length; i++) {
    const thunk = divThunks[i];
    // 单位
    const thunkUnit = unit[i];
    const unitId = i;

    // 局部处理
    let localResult: LocalResult[] = [];
    for (let j = 0; j < thunk.length; j++) {
      const aThunk = thunk[j];
      const num = aThunk.remainder;
      const numHan = digit[num];
      const localUnit = unitl[j];

      localResult.push({ num, numHan, unit: localUnit });
    }

    // 局部移除不必要0
    const localStack = trimZeroLocal(localResult);

    // 局部的值
    let localValue = 0;
    for (let q = 0; q < localResult.length; q++) {
      localValue += localResult[q].num * Math.pow(10, q);
    }

    thunkStack.push({
      localResult,
      unit: thunkUnit,
      unitId,
      localStack,
      localValue,
    });
  }

  // read
  const spelledThunk: Thunk[] = [];
  const allWords: string[] = [];

  for (let i = thunkStack.length - 1; i >= 0; i--) {
    const aThunk = thunkStack[i];
    if (aThunk.localValue === 0) continue;

    const words = spell(aThunk.localStack);

    const lastThunk = last(spelledThunk);
    if (lastThunk) {
      if (lastThunk.unitId - aThunk.unitId > 1) {
        // 要加0，因为上一个空的被跳过了
        allWords.push("零");
      } else {
        // 如果是相邻的，则要判断当前的最高位是否为空
        // 能到达这里说明当前的最高位应该是千位，
        // 因为能到这里说明肯定在更高的位置上有更大的单位阿斯顿发山东发生的
        if (last(aThunk.localResult).num === 0) {
          allWords.push("零");
        }
      }
    }

    allWords.push(`${words}${aThunk.unit}`);
    spelledThunk.push(aThunk);
  }

  return {
    allWords,
    thunkStack,
    isZero: integerPart === 0,
  };
}

function spellFraction(result: any[]) {
  const words = result.map((e) => {
    if (e.num === 0) return "";
    return `${e.numHan}${e.unit}`;
  });
  return words;
}

function parseDecimalPart(decimalPart: number) {
  const thunks: DecimalThunk[] = [];

  let isZero = true;

  let number = decimalPart;
  for (let i = 0; i < fraction.length; i++) {
    number = number * 10;
    const remainder = Math.floor(number % 10);
    const num = remainder;

    thunks.push({
      num,
      numHan: digit[num],
      unit: fraction[i],
      unitId: i,
    });

    if (num != 0) {
      isZero = false;
    }
  }

  const allWords = spellFraction(thunks);
  return { allWords, thunks, isZero };
}

// group span
function rmb(value: any) {
  // 负数后面在考虑
  let number = Math.abs(value);

  // 获取整数部分
  const integerPart = Math.floor(number);
  const decimalPart = number - integerPart;

  // 解析
  const integer = parseIntegerPart(integerPart);
  const decimal = parseDecimalPart(decimalPart);

  const yjfArr = [
    {
      unit: "元",
      value: integerPart,
      words: integer.allWords.join(""),
      unitId: 1,
    },
    {
      unit: "角",
      value: decimal.thunks[0].num,
      words: decimal.thunks[0].numHan,
    },
    {
      unit: "分",
      value: decimal.thunks[1].num,
      words: decimal.thunks[1].numHan,
    },
  ];

  const words: string[] = [];
  // 读元
  if (integerPart !== 0) {
    words.push(integer.allWords.join(""), "元");
  }

  if (decimal.thunks[0].num !== 0) {
    words.push(decimal.thunks[0].numHan, "角");
  }

  if (decimal.thunks[1].num !== 0) {
    // if (integerPart !== 0 && decimal.thunks[0].num === 0) {
    //   words.push("零");
    // }
    words.push(decimal.thunks[1].numHan, "分");
  }

  // 如果有元而且没分就以整结尾
  if (integerPart !== 0 && decimal.thunks[1].num === 0) {
    words.push("整");
  }

  if (words.length === 0) {
    console.log("零元整");
  } else {
    console.log(words.join(""));
  }
}

// yi wan yuan jiao fen

// 将所有连续的0换成一个0，如果是整体开头的或末尾的0就删除

// 包含了 角分
rmb(50000);
