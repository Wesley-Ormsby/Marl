import { TT } from "./TT.js";
import { standardLibrary } from "./standardLibrary.js";
import { modules } from "./modules/main.js"

export async function run(json, outFun, id) {
  let ast = json.AST
  let imports = json.imports
  let vars = [];
  let funs = [];
  let exit = false;
  let next = false;
  let unpack = false;
  let returned = false;
  let callStack = [];

  for(var modName of Object.keys(imports)) {
    let modImport = imports[modName]
    let mod = modules[modName]
    if(mod ?? false) {
      if(modImport.importedFuns == "ALL") {
        for(var fun of Object.keys(mod)) {
          standardLibrary[fun] = mod[fun]
        }
      } else {
        for(var fun of modImport.importedFuns) {
          if(mod[fun.value] ?? false) {
            standardLibrary[fun.value] = mod[fun.value]
          } else {
            throw {
              token: fun,
              msg: `Function '${fun.value}' does not exist in '${modName}' module`,
              callStack: callStack,
            }; 
          }
        }
      }
    } else {
      throw {
        token: modImport,
        msg: `Module '${modName}' does not exist`,
        callStack: callStack,
      }; 
    }
  }

  function op(token, list) {
    let type = token.opType;
    if (type == TT.NOT) {
      if (list.length < 1) {
        throw {
          token: token,
          msg: `Too few values in stack to preform '!' operation`,
          callStack: callStack,
        };
      }
      list.push({ type: TT.BOOL, value: !isTrue(list.pop()) });
      return list;
    }
    if (list.length < 2) {
      throw {
        token: token,
        msg: `Too few values in stack to preform '${token.value}' operation`,
        callStack: callStack,
      };
    }
    let right = list.pop();
    let left = list.pop();

    let a = left.value;
    let b = right.value;
    let returnVal;
    let operations = {
      FLOOR: (a, b) => Math.floor(a / b),
      MINUS: (a, b) => a - b,
      STAR: (a, b) => a * b,
      SLASH: (a, b) => a / b == Infinity ? 0 : a / b,
      POWER: (a, b) => Math.pow(a, b),
      MOD: (a, b) => a % b,
      LESS_EQUAL: (a, b) => a <= b,
      GREATER_EQUAL: (a, b) => a >= b,
      LESS: (a, b) => a < b,
      GREATER: (a, b) => a > b,
    };
    if (type == TT.EQUAL) {
      if (left.type == TT.STACK) {
        throw {
          token: token,
          msg: `Invalid left operand of type 'stack' for '==' operation`,
          callStack: callStack,
        };
      }
      if (right.type == TT.STACK) {
        throw {
          token: token,
          msg: `Invalid right operand of type 'stack' for '==' operation`,
          callStack: callStack,
        };
      }
      returnVal = a === b;
    } else if (type == TT.NOT_EQUAL) {
      if (left.type == TT.STACK) {
        throw {
          token: token,
          msg: `Invalid left operand of type 'stack' for '!=' operation`,
          callStack: callStack,
        };
      }
      if (right.type == TT.STACK) {
        throw {
          token: token,
          msg: `Invalid right operand of type 'stack' for '!=' operation`,
          callStack: callStack,
        };
      }
      returnVal = a !== b;
    } else if (type == TT.PLUS) {
      if (
        left.type == TT.BOOL ||
        left.type == TT.STACK ||
        left.type == TT.NIL
      ) {
        throw {
          token: token,
          msg: `Invalid left operand of type '${left.type.toLowerCase()}' for '+' operation`,
          callStack: callStack,
        };
      }
      if (
        right.type == TT.BOOL ||
        right.type == TT.STACK ||
        right.type == TT.NIL
      ) {
        throw {
          token: token,
          msg: `Invalid right operand of type '${right.type.toLowerCase()}' for '+' operation`,
          callStack: callStack,
        };
      }
      if (left.type != right.type) {
        throw {
          token: token,
          msg: `Right and left operands must be the same type for '+' operation`,
          callStack: callStack,
        };
      }
      returnVal = a + b;
    } else if (type == TT.AND) {
      returnVal = isTrue(left) ? b : a;
    } else if (type == TT.OR) {
      returnVal = isTrue(left) ? a : b;
    } else {
      if (left.type != TT.NUMBER) {
        throw {
          token: token,
          msg: `Left operand must be of type 'number' for '${token.value}' operation`,
          callStack: callStack,
        };
      }
      if (right.type != TT.NUMBER) {
        throw {
          token: token,
          msg: `Right operand must be of type 'number' for '${token.value}' operation`,
          callStack: callStack,
        };
      }
      returnVal = operations[type](a, b);
    }
    let returnType = {
        string: TT.STRING,
        boolean: TT.BOOL,
        number: TT.NUMBER
      }[typeof(returnVal)]
    list.push({
      type: returnType,
      value: returnVal,
    });
    return list;
  }

  function isTrue(value) {
    switch (value.type) {
      case TT.BOOL:
        return value.value;
      case TT.NUMBER:
        return value.value != 0;
      case TT.STRING:
        return value.value != "";
      case TT.STACK:
        return value.value.length != 0;
      case TT.NIL:
        return false;
    }
  }
  await run(ast);

  async function run(value) {
    if (exit || next || returned) {
      return;
    }

    if (value.type == TT.EXIT) {
      exit = true;
      return;
    }
    if (value.type == TT.NEXT) {
      next = true;
      return;
    }
    if (value.type == TT.RETURN) {
      returned = await run(value.value);
      return;
    }
    if (value.type == TT.UNPACK) {
      returned = await run(value.value);
      if (returned.type == TT.STACK) {
        unpack = true;
      }
      return;
    }

    if (value.type == "SCOPE") {
      let newFuns = {};
      for (var each of value.scope.filter((item) => item.type == TT.FUN)) {
        newFuns[each.name] = {
          args: each.args,
          scope: each.scope,
        };
      }
      funs.push(newFuns);
      vars.push({});
      for (var each of value.scope) {
        await run(each);
      }
      vars.pop();
      funs.pop();
      return;
    }

    if ([TT.NUMBER, TT.BOOL, TT.STRING, TT.NIL].includes(value.type)) {
      return { value: value.value, type: value.type };
    }

    if (value.type == TT.STACK) {
      let returnList = [];
      for (var each of value.stack) {
        if (each.type == "OP") {
          returnList = op(each, returnList);
        } else {
          let newItem = await run(each);
          if (unpack) {
            unpack = false;
            returnList = returnList.concat(newItem.value);
          } else {
            returnList.push(newItem);
          }
        }
      }
      return { type: TT.STACK, value: returnList };
    }

    if (value.type == "TEMPSTACK") {
      let returnList = [];
      for (var each of value.stack) {
        if (each.type == "OP") {
          returnList = op(each, returnList);
        } else {
          let newItem = await run(each);
          if (unpack) {
            unpack = false;
            returnList = returnList.concat(newItem.value);
          } else {
            returnList.push(newItem);
          }
        }
      }
      return returnList.length >= 1
        ? returnList.pop()
        : { type: TT.NIL, value: "nil" };
    }

    if (value.type == TT.IF) {
      if (isTrue(await run(value.condition))) {
        await run(value.scope);
      } else {
        for (var each of value.elif) {
          if (isTrue(await run(each.condition))) {
            await run(each.scope);
            return;
          }
        }
        await run(value.else); // else
      }
    }

    if (value.type == TT.CASE) {
      for (var each of value.whens) {
        if (isTrue(await run(each.condition))) {
          await run(each.scope);
          return;
        }
      }
      await run(value.default); // default
    }

    if (value.type == TT.WHILE) {
      while (!returned && isTrue(await run(value.condition))) {
        await run(value.scope);
        if (exit) {
          exit = false;
          return;
        }
        next = false;
      }
    }

    if (value.type == TT.FOREACH) {
      let list = await run(value.of);
      if (list.type != TT.STACK) {
        throw {
          token: value.of,
          msg: `'of' value of 'foreach' loop must evaluate to a stack'`,
          callStack: callStack,
        };
      }

      for (var each of list.value) {
        let newVar = {};
        newVar[value.variable] = { type: TT.LET, value: each };
        vars.push(newVar);
        await run(value.scope);
        if (exit) {
          exit = false;
          return;
        }
        next = false;
        vars.pop();
      }
    }

    if (value.type == TT.FOR) {
      let from = await run(value.from);
      if (from.type != TT.NUMBER) {
        throw {
          token: value.from,
          msg: `'from' value of 'for' loop must evaluate to a number'`,
          callStack: callStack,
        };
      }
      let to = await run(value.to);
      if (to.type != TT.NUMBER) {
        throw {
          token: value.to,
          msg: `'to' value of 'for' loop must evaluate to a number'`,
          callStack: callStack,
        };
      }
      let by = value.by === 1 ? { type: TT.NUMBER, value: 1 } : await run(value.by);
      if (by.type != TT.NUMBER) {
        throw {
          token: value.by,
          msg: `'by' value of 'for' loop must evaluate to a number'`,
          callStack: callStack,
        };
      }

      let newVar = {};
      newVar[value.variable] = { type: TT.LET, value: from };
      vars.push(newVar);
      if (by.value >= 0) {
        while (true) {
          let currentLoopIndex = vars[vars.length - 1][value.variable].value;
          if (currentLoopIndex.type != TT.NUMBER) {
            throw {
              token: value.variableToken,
              msg: `'for' variable '${value.variable}' must be a number. A reassignment may have occured to make '${value.variable}' not a number`,
              callStack: callStack,
            };
          }
          if (currentLoopIndex.value <= to.value) {
            await run(value.scope);
            if (exit) {
              exit = false;
              break;
            }
            next = false;
          } else {
            break;
          }
          currentLoopIndex.value = currentLoopIndex.value + by.value;
        }
      } else {
        while (true) {
          let currentLoopIndex = vars[vars.length - 1][value.variable].value;
          if (currentLoopIndex.type != TT.NUMBER) {
            throw {
              token: value.variableToken,
              msg: `'for' variable '${value.variable}' must be a number. A reassignment may have occured to make '${value.variable}' not a number`,
              callStack: callStack,
            };
          }
          if (currentLoopIndex.value >= to.value) {
            await run(value.scope);
          } else {
            break;
          }
          currentLoopIndex.value = currentLoopIndex.value + by.value;
        }
      }
      vars.pop();
    }

    if (value.type == TT.VAL) {
      if (typeof vars[vars.length - 1][value.name] != "undefined") {
        throw {
          token: value.variableToken,
          msg: `Variable ${value.name} is already defined`,
          callStack: callStack,
        };
      }
      vars[vars.length - 1][value.name] = {
        type: TT.VAL,
        value: await run(value.value),
      };
    }

    if (value.type == TT.LET) {
      if (typeof vars[vars.length - 1][value.name] != "undefined") {
        throw {
          token: value.variableToken,
          msg: `Variable ${value.name} is already defined`,
          callStack: callStack,
        };
      }
      vars[vars.length - 1][value.name] = {
        type: TT.LET,
        value: await run(value.value),
      };
    }

    if (value.type == "REASSIGN") {
      for (let i = vars.length - 1; i >= 0; i--) {
        if (typeof vars[i][value.name] != "undefined") {
          if (vars[i][value.name].type == TT.VAL) {
            throw {
              token: value.varToken,
              msg: `Cannot reassing immutable variable '${value.name}'`,
              callStack: callStack,
            };
          }
          vars[i][value.name].value = await run(value.value);
          return;
        }
      }
      throw {
        token: value.varToken,
        msg: `Cannot reassign undeclared variable '${value.name}'`,
        callStack: callStack,
      };
    }

    if (value.type == TT.IDENTIFIER) {
      for (let i = vars.length - 1; i >= 0; i--) {
        if (typeof vars[i][value.value] != "undefined") {
          return vars[i][value.value].value;
        }
      }
      throw {
        token: value,
        msg: `Variable '${value.value}' has not been declared`,
        callStack: callStack,
      };
    }

    if (value.type == "CALL") {
      // STDLIB
      let name = value.name;
      let args = value.args;
      if (typeof standardLibrary[value.name] != "undefined") {
        if (args.length != standardLibrary[name].parms.length) {
          throw {
            token: value,
            msg: `Invalid number of arguments for '${name}' function`,
            callStack: callStack,
          };
        }
        let allCallParms = [];
        for (let i = 0; i < args.length; i++) {
          let callParm = await run(args[i]);
          allCallParms.push(callParm);
          let funParm = standardLibrary[name].parms[i];
          if (typeof funParm == "object" && funParm.includes(callParm.type)) {
            continue;
          }
          if (funParm != callParm.type) {
            throw {
              token: value.errorArgs[i],
              msg: `Argument ${
                i + 1
              } cannot be a type '${callParm.type.toLowerCase()}' for '${name}' function`,
              callStack: callStack,
            };
          }
        }
        if(standardLibrary[name].unpack) {
          unpack = true;
        }
        return await standardLibrary[name].fun(allCallParms, callStack, value, outFun, id);
      } else {
        for (let i = funs.length - 1; i >= 0; i--) {
          if (typeof funs[i][value.name] != "undefined") {
            let calledFun = funs[i][value.name];
            let newVars = {};
            for (let i = 0; i < calledFun.args.length; i++) {
              newVars[calledFun.args[i]] = {
                type: TT.LET,
                value:
                  value.args.length >= i + 1
                    ? await run(value.args[i])
                    : { type: TT.NIL, value: "nil" },
              };
            }
            vars.push(newVars);
            callStack.unshift({
              name: value.name,
              line: value.line,
              charStart: value.charStart,
            });
            await run(calledFun.scope);
            callStack.pop();
            vars.pop();
            if (returned) {
              let toReturn = JSON.parse(JSON.stringify(returned)); // deepcopy
              returned = false;
              return toReturn;
            } else {
              return { type: TT.NIL, value: "nil" };
            }
          }
        }
        throw {
          token: value,
          msg: `Function '${name}' is not declared`,
          callStack: callStack,
        };
      }
    }
  }
}
