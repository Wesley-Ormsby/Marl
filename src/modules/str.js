import { TT } from "./../TT.js";

export let str = {
  str_startsWith: {
    parms: [TT.STRING, TT.STRING],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return {
        type: TT.BOOL,
        value: parms[0].value.startsWith(parms[1].value),
      };
    },
  },
  str_endsWith: {
    parms: [TT.STRING, TT.STRING],
    unpack: false,
    fun: function print(parms, callStack, token) {
      return {
        type: TT.BOOL,
        value: parms[0].value.endsWith(parms[1].value),
      };
    },
  },
  str_indexOf: {
    parms: [TT.STRING, TT.STRING],
    unpack: false,
    fun: function print(parms, callStack, token) {
      const index = parms[0].value.indexOf(parms[1].value);
      return {
        type: TT.NUMBER,
        value: index == -1 ? 0 : index + 1,
      };
    },
  },
};
