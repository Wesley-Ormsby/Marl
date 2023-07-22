import { math } from "./modules/math.js";
import { TT } from "./TT.js";

export let standardLibrary = {
  print: {
    parms: [[TT.NIL, TT.STACK, TT.BOOL, TT.NUMBER, TT.STRING]],
    unpack: false,
    fun: function print(parms, callStack, token, outFun, id) {
      const purple = "\x1b[35m";
      const reset = "\x1b[0m";
      function prettyPrint(token) {
        if (token.type == TT.STACK) {
          level += 1;
          let result = "";
          for (var each of token.value) {
            result += prettyPrint(each);
          }
          level -= 1;
          result =
            "  ".repeat(level) + "(\n" + result + "  ".repeat(level) + ")\n";
          return result;
        } else {
          if (token.type == TT.STRING) {
            let newStr = ""
            let oldStr = token.value
            while(oldStr) {
              if(/^\x1b\[/.test(oldStr)) {
                newStr += "\\x1b\["
                oldStr = oldStr.slice(2)
              } else {
                newStr += oldStr[0]
                oldStr = oldStr.slice(1)
              }
            }
            return "  ".repeat(level) + newStr + "\n";
          } else {
            return (
              purple + "  ".repeat(level) + String(token.value) + reset + "\n" 
            );
          }
        }
      }
      let level = 0;
      let toPrint = prettyPrint(parms[0]).split("\n");
      toPrint.pop();
      toPrint = toPrint.join("\n");
      if (typeof window === "undefined") {
        console.log(toPrint);
      } else {
        outFun(toPrint,id)
      }
      
      return { type: TT.NIL, value: "nil" };
    },
  },
  toNumber: {
    parms: [[TT.NIL, TT.STRING, TT.NUMBER, TT.BOOL]],
    unpack: false,
    fun: function print(parms, callStack, token) {
      let input = parms[0];
      let newNumber;
      switch (input.type) {
        case TT.NUMBER:
          newNumber = input.value;
          break;
        case TT.NIL:
          newNumber = 0;
          break;
        case TT.BOOL:
          newNumber = input.value ? 1 : 0;
          break;
        case TT.STRING:
          let i = 0;
          let value = input.value.trim();
          if (value[0] == "-") {
            i += 1;
          }
          while (i < value.length && /[0-9]/.test(value[i])) {
            i += 1;
          }
          if (value[i] == ".") {
            i += 1;
            while (i < value.length && /[0-9]/.test(value[i])) {
              i += 1;
            }
          }
          if (i != value.length) {
            throw {
              token: token,
              msg: `Invalid number string`,
              callStack: callStack,
            };
          }
          newNumber = Number(value);
      }
      return { type: TT.NUMBER, value: newNumber };
    },
  },
  toBool: {
    parms: [[TT.NIL, TT.STRING, TT.NUMBER, TT.BOOL, TT.STACK]],
    unpack: false,
    fun: function print(parms, callStack, token) {
      let value = parms[0];
      switch (value.type) {
        case TT.BOOL:
          return { type: TT.NUMBER, value: value.value };
        case TT.NUMBER:
          return { type: TT.NUMBER, value: value.value != 0 };
        case TT.STRING:
          return { type: TT.NUMBER, value: value.value != "" };
        case TT.STACK:
          return { type: TT.NUMBER, value: value.value.length != 0 };
        case TT.NIL:
          return { type: TT.NUMBER, value: false };
      }
    },
  },
  toString: {
    parms: [[TT.NIL, TT.STRING, TT.NUMBER, TT.BOOL, TT.STACK]],
    unpack: false,
    fun: function print(parms, callStack, token) {
      if(parms[0].type == TT.STRING) {
        return parms[0]
      }
      function toStringFromStack(value) {
        if(value.type == TT.STRING) {
          return "\"" + value.value.replace(/\\/g,"\\\\") + "\""
        } else if(value.type == TT.STACK) {
          let returnString = "("
          for(var each of value.value) {
            returnString += toStringFromStack(each)
          }
          returnString += ")"
          return returnString
        } else {
          return String(value.value)
        }
      }
      return { type: TT.STRING, value: toStringFromStack(parms[0]) };
    },
  },
  unwrap: {
    parms: [TT.STACK],
    unpack: true,
    fun: function print(parms, callStack, token) {
      return parms[0];
    },
  },
  push: {
    parms: [TT.STACK, [TT.NIL, TT.STRING, TT.NUMBER, TT.BOOL, TT.STACK]],
    unpack: false,
    fun: function print(parms, callStack, token) {
      parms[0].value.push(parms[1])
      return parms[0];
    },
  },
  underPush: {
    parms: [TT.STACK, [TT.NIL, TT.STRING, TT.NUMBER, TT.BOOL, TT.STACK]],
    unpack: false,
    fun: function print(parms, callStack, token) {
      parms[0].value.unshift(parms[1])
      return parms[0];
    },
  },
  pull: {
    parms: [TT.STACK],
    unpack: false,
    fun: function print(parms, callStack, token) {
      if(parms[0].value.length == 0) {
        throw {
           token: token,
           msg: `Argument 1 cannot be an empty stack for 'pull' function`,
           callStack: callStack,
      };
    }
      return parms[0].value.pop()
    },
  },
  underPull: {
    parms: [TT.STACK],
    unpack: false,
    fun: function print(parms, callStack, token) {
      if(parms[0].value.length == 0) {
        throw {
           token: token,
           msg: `Argument 1 cannot be an empty stack for 'underPull' function`,
           callStack: callStack,
      };
    }
      return parms[0].value.shift()
    },
  },
  length: {
    parms: [[TT.STACK, TT.STRING]],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return {type: TT.NUMBER, value: parms[0].value.length}
    },
  },
  type: {
    parms: [[TT.NIL, TT.STRING, TT.NUMBER, TT.BOOL, TT.STACK]],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return {type: TT.STRING, value: parms[0].type.toLowerCase()}
    },
  },
  charFromCode: {
    parms: [TT.NUMBER],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return {type: TT.STRING, value: String.fromCharCode(parms[0].value)}
    },
  },
  reverse: {
    parms: [TT.STACK],
    unpack: false,
    fun: function print(parms, callStack, token) {
      parms[0].value = parms[0].value.reverse()
      return {type: TT.STACK, value: parms[0].value}
    },
  },
  codeFromChar: {
    parms: [TT.STRING],
    unpack: false,
    fun: function print(parms, callStack, token) {
      if(parms[0].value.length != 1) {
        throw {
          token: token,
          msg: `Argument 1 must be a string with a single character`,
          callStack: callStack,
        };
      }
      return {type: TT.NUMBER, value: parms[0].value.charCodeAt(0)}
    },
  },
  index: {
    parms: [[TT.STRING, TT.STACK], TT.NUMBER],
    unpack: false,
    fun: function print(parms, callStack, token) {
      const index = Math.abs(parms[1].value)
      const stack = parms[0].type == TT.STRING ?  parms[0].value.split("").map(function(x) {return {type:TT.STRING,value:x}}) : parms[0].value
      const fromTop = parms[1].value < 0
      if(index == 0) {
        throw {
          token: token,
          msg: `Argument 2 for 'index' cannot be '0'`,
          callStack: callStack,
        };
      }
      if(index != Math.floor(index)) {
        throw {
          token: token,
          msg: `Argument 2 for 'index' function must be an interger`,
          callStack: callStack,
        };
      }
      if(index > stack.length) {
        throw {
          token: token,
          msg: `Argument 2 for 'index' is out of range for the stack`,
          callStack: callStack,
        };
      }
      if(fromTop) {
        return stack.reverse()[index-1]
      } else {
        return stack[index-1]
      }
    },
  },
  wait: {
    parms: [TT.NUMBER],
    unpack: false,
    fun: async function print(parms, callStack, token) {
      async function wait(secs) {
        return new Promise(resolve => {
          setTimeout(resolve, secs*1000);
        });
      }
      await wait(parms[0].value)
      return { type: TT.NIL, value: "nil" };
    },
  },
  random: {
    parms: [TT.NUMBER, TT.NUMBER],
    unpack: false,
    fun: function print(parms, callStack, token) {
      const number1 = parms[0].value
      const number2 = parms[1].value
      if(number1 != Math.floor(number1)) {
        throw {
          token: token,
          msg: `Argument 1 for 'random' function must be an interger`,
          callStack: callStack,
        };
      }
      if(number2 != Math.floor(number2)) {
        throw {
          token: token,
          msg: `Argument 2 for 'random' function must be an interger`,
          callStack: callStack,
        };
      }
      const min = number1 > number2 ? number2 : number1
      const max = number1 < number2 ? number2 : number1
      
      return { type: TT.NUMBER, value: Math.floor(Math.random() * (max - min + 1)) + min };
    },
  },
  input: {
    parms: [TT.STRING],
    unpack: true,
    fun: async function print(parms, callStack, token) {
      let readline = false;
      if (typeof window === "undefined") {
        readline = await import("readline");
      }
      if(readline) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        const answer = await new Promise((resolve) => {
          rl.question(parms[0].value, resolve);
        });
        rl.close();
        return { type: TT.STRING, value: answer };
      } else {
        throw {
          token: token,
        msg: `'input' function does not work with online interpreter`,
        callStack: callStack
      }
      }  
    },
  },
  split: {
    parms: [TT.STRING, TT.STRING],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return {
        type: TT.STACK,
        value: parms[0].value.split(parms[1].value).map(function (x) {
          return { type: TT.STRING, value: x };
        }),
      };
    },
  },
  join: {
    parms: [TT.STACK,TT.STRING],
    unpack: false,
    fun: function print(parms, callStack, token) {
      function toStringFromStack(value) {
        if(value.type == TT.STRING) {
          return "\"" + value.value.replace(/\\/g,"\\\\") + "\""
        } else if(value.type == TT.STACK) {
          let returnString = "("
          for(var each of value.value) {
            returnString += toStringFromStack(each)
          }
          returnString += ")"
          return returnString
        } else {
          return String(value.value)
        }
      }
      let stack = parms[0].value.map(x => x.type == TT.STRING ? x.value : toStringFromStack(x))
      let join = parms[1].value

      return { type: TT.STRING, value: stack.join(join) };
    },
  },
  connect: {
    parms: [TT.STACK,TT.STACK],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return { type: TT.STACK, value: parms[0].value.concat(parms[1].value) };
    },
  },
};
