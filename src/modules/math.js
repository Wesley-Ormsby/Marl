import { TT } from "./../TT.js";

export let math = {
  math_pi: {
    parms: [],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return {type: TT.NUMBER, value: Math.PI}
    },
  },
  math_floor: {
    parms: [TT.NUMBER],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return {type: TT.NUMBER, value: Math.floor(parms[0].value)}
    },
  },
  math_ceil: {
    parms: [TT.NUMBER],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return {type: TT.NUMBER, value: Math.ceil(parms[0].value)}
    },
  },
  math_sqrt: {
    parms: [TT.NUMBER],
    unpack: false,
    fun: function print(parms, callStack, token) {
      if(parms[0].value < 0) {
        throw {
          token: token,
          msg: `Argument '1' cannot be negative for 'math_sqrt' function`,
          callStack: callStack,
        }; 
      }   
      return {type: TT.NUMBER, value: Math.sqrt(parms[0].value)}
    },
  },
};
