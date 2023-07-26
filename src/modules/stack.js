import { TT } from "./../TT.js";

export let stack = {
  stack_populate: {
    parms: [TT.NUMBER, [TT.STRING, TT.NUMBER, TT.BOOL, TT.NIL, TT.STACK]],
    unpack: false,
    fun: function print(parms, callStack, token) {
        if(parms[0].value != Math.floor(parms[0].value)) {
            throw {
              token: token,
              msg: `Argument 1 for 'stack_populate' function must be an interger`,
              callStack: callStack,
            };
          }
      return {
        type: TT.STACK,
        value: Array(parms[0].value).fill(parms[1])
      };
    },
  },
  stack_isIn: {
    parms: [TT.STACK, [TT.STRING, TT.NUMBER, TT.BOOL, TT.NIL]],
    unpack: false,
    fun: function print(parms, callStack, token) {
      let isIn = false
      let check = parms[1].value
      for(var value of parms[0].value) {
        if(value.value === check) {
          isIn = true
          break
        }
      }
      return {
        type: TT.BOOL,
        value: isIn
      };
    },
  },
};
