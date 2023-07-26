import { TT } from "./TT.js";

export function parse(tokens) {
  let brackets = [];
  let AST = { type: "SCOPE", scope: [] };
  let inFun = 0;
  let inLoop = 0;
  let inCall = [];
  let imports = {};

  parseImports();
  while (tokens.length >= 1) {
    let possibleValue = parse();
    if (possibleValue) {
      AST.scope.push(possibleValue);
    }
  }

  function isInStack() {
    return brackets.includes(TT.LEFT_PREN) || brackets.includes(TT.LEFT_SQR);
  }

  function removeSeperators() {
    while (tokens[0].type == TT.SEPERATOR) {
      tokens.shift();
    }
  }

  function parseScope() {
    brackets.push(TT.LEFT_CRLY);
    let firstCurly = tokens.shift();
    let returnValue = [];
    while (tokens.length >= 1 && tokens[0].type != TT.RIGHT_CRLY) {
      let possibleValue = parse();
      if (possibleValue) {
        returnValue.push(possibleValue);
      }
    }
    if (tokens.length == 0) {
      throw {
        token: {},
        msg: `Unterminated scope started on line ${firstCurly.line} at character ${firstCurly.charStart}`,
        end: true,
      };
    }
    tokens.shift();
    brackets.pop();
    return { type: "SCOPE", scope: returnValue };
  }

  function methodCall(base) {
    if (tokens[1].type != TT.IDENTIFIER) {
      throw {
        token: tokens[1],
        msg: `Expected identifier after '.' for method call`,
      };
    }
    if (tokens[2].type != TT.LEFT_PREN) {
      throw {
        token: tokens[2],
        msg: `Expected '(' after method call identifier`,
      };
    }
    let newReturnValue = {
      type: "CALL",
      args: [base],
      errorArgs: [base],
    };
    tokens.shift(); // remove .
    let identifier = tokens.shift();
    newReturnValue.name = identifier.value;
    newReturnValue.line = identifier.line;
    newReturnValue.charStart = identifier.charStart;
    newReturnValue.charEnd = identifier.charEnd;

    brackets.push(TT.LEFT_PREN);
    let scopeStartForError = tokens.shift(); // remove (
    while (tokens.length >= 1 && tokens[0].type != TT.RIGHT_PREN) {
      let possibleErrorToken = {
        charStart: tokens[0].charStart,
        charEnd: tokens[0].charEnd,
        line: tokens[0].line,
      };
      let possibleValue = parse();
      if (possibleValue) {
        newReturnValue.args.push(possibleValue);
        newReturnValue.errorArgs.push(possibleErrorToken);
      }
    }
    if (tokens.length == 0) {
      throw {
        token: {},
        msg: `Unterminated method call started on line ${scopeStartForError.line} at character ${scopeStartForError.charStart}`,
        end: true,
      };
    }
    tokens.shift();
    brackets.pop();
    if (tokens[0].type == TT.DOT) {
      return methodCall(newReturnValue);
    }
    return newReturnValue;
  }

  function parseValue() {
    // Parse Numbers, Strings, and Bools, and nils
    let currentToken = tokens[0].type;
    if (TT.NUMBER == currentToken) {
      let returnVal = tokens.shift();
      returnVal.value = Number(returnVal.value);
      if (TT.DOT == tokens[0].type) {
        return methodCall(returnVal);
      }
      return returnVal;
    }
    if (TT.BOOL == currentToken) {
      let returnVal = tokens.shift();
      returnVal.value = returnVal.value == "true";
      if (TT.DOT == tokens[0].type) {
        return methodCall(returnVal);
      }
      return returnVal;
    }
    if (TT.STRING == currentToken) {
      let returnVal = tokens.shift();
      let newString = returnVal.value.slice(1, -1).split("");
      returnVal.value = "";
      while (newString.length >= 1) {
        let newChar = newString.shift();
        if (newChar == "\\" && newString.length >= 1) {
          let secondChar = newString.shift();
          if (secondChar == "\\") {
            returnVal.value += "\\";
          } else if (secondChar == "n") {
            returnVal.value += "\n";
          } else if (secondChar == '"') {
            returnVal.value += '"';
          } else {
            returnVal.value += "\\" + secondChar;
          }
        } else {
          returnVal.value += newChar;
        }
      }
      if (TT.DOT == tokens[0].type) {
        return methodCall(returnVal);
      }
      return returnVal;
    }
    if (TT.NIL == currentToken) {
      if (TT.DOT == tokens[1].type) {
        return methodCall(tokens.shift());
      }
      return tokens.shift();
    }

    // Parse Temporary Stacks
    if (TT.LEFT_SQR == currentToken) {
      brackets.push(TT.LEFT_SQR);
      let stackStartForError = tokens.shift();
      let returnValue = { type: "TEMPSTACK", stack: [] };
      while (tokens.length >= 1 && tokens[0].type != TT.RIGHT_SQR) {
        let possibleValue = parse();
        if (possibleValue) {
          returnValue.stack.push(possibleValue);
        }
      }
      if (tokens.length == 0) {
        throw {
          token: {},
          msg: `Unterminated temporary stack started on line ${stackStartForError.line} at character ${stackStartForError.charStart}`,
          end: true,
        };
      }
      tokens.shift();
      brackets.pop();
      if (TT.DOT == tokens[0].type) {
        return methodCall(returnValue);
      }
      return returnValue;
    }

    // Parse Stacks
    if (TT.LEFT_PREN == currentToken) {
      brackets.push(TT.LEFT_PREN);
      let stackStartForError = tokens.shift();
      let returnValue = {
        type: TT.STACK,
        stack: [],
        line: stackStartForError.line,
        charStart: stackStartForError.charStart,
        charEnd: stackStartForError.charStart,
      };
      while (tokens.length >= 1 && tokens[0].type != TT.RIGHT_PREN) {
        let possibleValue = parse();
        if (possibleValue) {
          returnValue.stack.push(possibleValue);
        }
      }
      if (tokens.length == 0) {
        throw {
          token: {},
          msg: `Unterminated stack started on line ${stackStartForError.line} at character ${stackStartForError.charStart}`,
          end: true,
        };
      }
      tokens.shift();
      brackets.pop();
      if (TT.DOT == tokens[0].type) {
        return methodCall(returnValue);
      }
      return returnValue;
    }

    // Parse Identifiers, Function Calls
    if (TT.IDENTIFIER == currentToken) {
      // Parse Function Calll
      if (tokens[1].type == TT.LEFT_PREN) {
        let returnValue = {};
        returnValue.type = "CALL";
        let identifier = tokens.shift();
        returnValue.name = identifier.value;
        returnValue.args = [];
        returnValue.line = identifier.line;
        returnValue.charStart = identifier.charStart;
        returnValue.charEnd = identifier.charEnd;
        returnValue.errorArgs = [];

        brackets.push(TT.LEFT_PREN);
        inCall.push(brackets.length);
        let callStartForError = tokens.shift(); // remove (
        while (tokens.length >= 1 && tokens[0].type != TT.RIGHT_PREN) {
          let possibleErrorToken = {
            charStart: tokens[0].charStart,
            charEnd: tokens[0].charEnd,
            line: tokens[0].line,
          };
          let possibleValue = parse();
          if (possibleValue) {
            returnValue.args.push(possibleValue);
            returnValue.errorArgs.push(possibleErrorToken);
          }
        }
        if (tokens.length == 0) {
          throw {
            token: {},
            msg: `Unterminated function call started on line ${callStartForError.line} at character ${callStartForError.charStart}`,
            end: true,
          };
        }
        tokens.shift();
        brackets.pop();
        inCall.pop();
        if (TT.DOT == tokens[0].type) {
          return methodCall(returnValue);
        }
        return returnValue;
      } else {
        // Parse Variable
        if (TT.DOT == tokens[1].type) {
          return methodCall(tokens.shift());
        }
        return tokens.shift();
      }
    }

    return false;
  }

  function parseImports() {
    removeSeperators();
    while (tokens.length >= 1 && TT.IMPORT == tokens[0].type) {
      tokens.shift();
      removeSeperators();
      if (TT.IDENTIFIER == tokens[0].type) {
        let identifier = tokens.shift();
        removeSeperators();
        imports[identifier.value] = {
          importedFuns: "ALL",
          line: identifier.line,
          charStart: identifier.charStart,
          charEnd: identifier.charEnd,
        };
      } else if (TT.LEFT_CRLY == tokens[0].type) {
        tokens.shift();
        removeSeperators();
        let importedFuns = [];
        while (TT.IDENTIFIER == tokens[0].type) {
          importedFuns.push(tokens.shift());
          removeSeperators();
        }
        if (TT.RIGHT_CRLY != tokens[0].type) {
          throw {
            token: tokens[0],
            msg: `Expected '}' to close import scope`,
          };
        }
        tokens.shift();
        removeSeperators();
        if (TT.FROM != tokens[0].type) {
          throw {
            token: tokens[0],
            msg: `Expected 'from' after import scope`,
          };
        }
        tokens.shift();
        removeSeperators();
        if (TT.IDENTIFIER != tokens[0].type) {
          throw {
            token: tokens[0],
            msg: `Expected identifier after 'from' scope`,
          };
        }
        let identifier = tokens.shift();
        if (imports[identifier.value] ?? false) {
          if (imports[identifier.value].importedFuns != "ALL") {
            for (var each of importedFuns) {
              imports[identifier.value].importedFuns.push(each);
            }
          }
        } else {
          imports[identifier.value] = {
            importedFuns: importedFuns,
            line: identifier.line,
            charStart: identifier.charStart,
            charEnd: identifier.charEnd,
          };
        }
      } else {
        throw {
          token: tokens[0],
          msg: `Expected identifier or '{' after 'import'`,
        };
      }
      removeSeperators();
    }
  }

  function parse() {
    let currentToken = tokens[0].type;

    // End parsing
    if (currentToken == TT.EOF) {
      tokens.shift();
      return TT.EOF;
    }

    // Reassigning
    if (TT.IDENTIFIER == currentToken) {
      let i = 0;
      while (i++ < tokens.length && tokens[i].type == TT.SEPERATOR) {}
      if (TT.ASSIGN == tokens[i].type) {
        let varToken = tokens.shift();
        removeSeperators();
        tokens.shift();
        removeSeperators();
        let value = parseValue();
        if (!value) {
          throw {
            token: tokens[0],
            msg: `Expected value after '=' in reassignment`,
          };
        }
        return {
          type: "REASSIGN",
          name: varToken.value,
          value: value,
          varToken: varToken,
        };
      }
    }

    let isValue = parseValue();
    if (isValue) {
      return isValue;
    }

    // Parse operators
    if (
      [
        TT.FLOOR,
        TT.PLUS,
        TT.MINUS,
        TT.STAR,
        TT.SLASH,
        TT.POWER,
        TT.MOD,

        TT.EQUAL,
        TT.NOT_EQUAL,
        TT.LESS_EQUAL,
        TT.GREATER_EQUAL,
        TT.LESS,
        TT.GREATER,

        TT.AND,
        TT.OR,
        TT.NOT,
      ].includes(currentToken)
    ) {
      if (inCall[inCall.length - 1] == brackets.length || !isInStack()) {
        throw {
          token: tokens[0],
          msg: `Unexpected operator '${tokens[0].value}' found outside of a stack`,
        };
      }
      let returnValue = tokens.shift();
      returnValue.opType = currentToken;
      returnValue.type = "OP";
      return returnValue;
    }

    if (
      [
        TT.RIGHT_CRLY,
        TT.RIGHT_PREN,
        TT.RIGHT_SQR,
        TT.DOT,
        TT.ASSIGN,
        TT.ELSE,
        TT.ELIF,
        TT.IMPORT
      ].includes(currentToken)
    ) {
      throw {
        token: tokens[0],
        msg: `Unexpected token '${tokens[0].value}'`,
      };
    }

    // Skip seperators
    if (TT.SEPERATOR == currentToken) {
      tokens.shift();
      return false;
    }

    // All remaining tokens are keywords
    if (isInStack()) {
      throw {
        token: tokens[0],
        msg: `Unexpected keyword '${tokens[0].value}' found in a stack`,
      };
    }

    if (TT.NEXT == currentToken || TT.EXIT == currentToken) {
      if (!inLoop) {
        // not 0
        throw {
          token: tokens[0],
          msg: `Unexpected keyword '${tokens[0].value}' found outside a loop`,
        };
      }
      return { type: tokens.shift().type };
    }

    if (TT.RETURN == currentToken) {
      if (!inFun) {
        // not 0
        throw {
          token: tokens[0],
          msg: `Unexpected keyword 'return' found outside a function`,
        };
      }
      tokens.shift();
      removeSeperators();
      let returnValue = parseValue() || {type: TT.NIL, value:"nil"};
      return { type: TT.RETURN, value: returnValue };
    }

    if (TT.UNPACK == currentToken) {
      if (!inFun) {
        // not 0
        throw {
          token: tokens[0],
          msg: `Unexpected keyword 'unpack' found outside a function`,
        };
      }
      tokens.shift();
      removeSeperators();
      let returnValue = parseValue();
      return { type: TT.UNPACK, value: returnValue };
    }

    if (TT.WHILE == currentToken) {
      inLoop += 1;
      tokens.shift();
      removeSeperators();
      let condition = parseValue();
      if (!condition) {
        throw {
          token: tokens[0],
          msg: `Expected value after 'while' keyword for 'while' condition`,
        };
      }
      removeSeperators();
      if (TT.LEFT_CRLY != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected '{' after 'while' condition`,
        };
      }
      let result = parseScope();
      inLoop -= 1;
      return {
        type: TT.WHILE,
        condition: condition,
        scope: result,
      };
    }

    if (TT.FOR == currentToken) {
      inLoop += 1;
      tokens.shift();
      removeSeperators();
      if (TT.IDENTIFIER != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected variable identifier after 'for' keyword`,
        };
      }
      let variableToken = tokens.shift();
      removeSeperators();
      if (TT.FROM != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected 'from' after 'for' loop variable`,
        };
      }
      tokens.shift();
      removeSeperators();
      let from = parseValue();
      if (!from) {
        throw {
          token: tokens[0],
          msg: `Expected value after 'from' in 'for' loop`,
        };
      }
      removeSeperators();
      if (TT.TO != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected 'to' after 'from' value in 'for' loop`,
        };
      }
      tokens.shift();
      removeSeperators();
      let to = parseValue();
      if (!to) {
        throw {
          token: tokens[0],
          msg: `Expected value after 'to' in 'for' loop`,
        };
      }
      removeSeperators();
      let result;
      let by = 1;
      if (TT.BY == tokens[0].type) {
        tokens.shift();
        removeSeperators();
        by = parseValue();
        if (!by) {
          throw {
            token: tokens[0],
            msg: `Expected value after 'by' in 'for' loop`,
          };
        }
        removeSeperators();
        if (TT.LEFT_CRLY != tokens[0].type) {
          throw {
            token: tokens[0],
            msg: `Expected '{' after 'by' in 'for' loop`,
          };
        }
        tokens.shift();
        result = parseScope();
      } else if (TT.LEFT_CRLY == tokens[0].type) {
        result = parseScope();
      } else {
        throw {
          token: tokens[0],
          msg: `Expected 'by' or '{' after 'to' value in 'for' loop`,
        };
      }
      inLoop -= 1;
      return {
        type: TT.FOR,
        variable: variableToken.value,
        from: from,
        to: to,
        by: by,
        scope: result,
        variableToken: variableToken,
      };
    }

    if (TT.FOREACH == currentToken) {
      //foreach value of ()
      inLoop += 1;
      tokens.shift();
      removeSeperators();
      if (TT.IDENTIFIER != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected variable identifier after 'foreach' keyword`,
        };
      }
      let variable = tokens.shift().value;
      removeSeperators();
      if (TT.OF != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected "of" after 'foreach' variable in 'foreach' loop`,
        };
      }
      tokens.shift();
      removeSeperators();

      let of = parseValue();
      if (!of) {
        throw {
          token: tokens[0],
          msg: `Expected value after 'of' in 'foreach' loop`,
        };
      }
      removeSeperators();
      if (TT.LEFT_CRLY != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected '{' after 'of' value in 'foreach' loop`,
        };
      }
      let result = parseScope();
      inLoop -= 1;
      return {
        type: TT.FOREACH,
        variable: variable,
        of: of,
        scope: result,
      };
    }

    // Variable declaration
    if (TT.VAL == currentToken || TT.LET == currentToken) {
      tokens.shift();
      removeSeperators();
      if (TT.IDENTIFIER != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected variable identifier after ${currentToken.toLowerCase()}`,
        };
      }
      let variableToken = tokens.shift();
      removeSeperators();
      if (TT.ASSIGN != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected '=' after variable identifier`,
        };
      }
      tokens.shift();
      removeSeperators();
      let value = parseValue();
      if (!value) {
        throw {
          token: tokens[0],
          msg: `Expected value after '='`,
        };
      }
      return {
        type: currentToken,
        name: variableToken.value,
        value: value,
        variableToken: variableToken,
      };
    }

    // Pare if, elif, else
    if (TT.IF == currentToken) {
      // IF
      tokens.shift();
      removeSeperators();
      let condition = parseValue();
      if (!condition) {
        throw {
          token: tokens[0],
          msg: `Expected value for 'if' condition after 'if'`,
        };
      }
      removeSeperators();
      if (TT.LEFT_CRLY != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected '{' after 'if' condition`,
        };
      }
      let result = parseScope();
      removeSeperators();
      // ELIF
      let elifs = [];
      while (TT.ELIF == tokens[0].type) {
        tokens.shift();
        removeSeperators();
        let elifCondition = parseValue();
        if (!elifCondition) {
          throw {
            token: tokens[0],
            msg: `Expected value for 'elif' condition after 'elif'`,
          };
        }
        removeSeperators();
        if (TT.LEFT_CRLY != tokens[0].type) {
          throw {
            token: tokens[0],
            msg: `Expected '{' after 'elif' condition`,
          };
        }
        let elifResult = parseScope();
        removeSeperators();
        elifs.push({ condition: elifCondition, scope: elifResult });
      }
      // ELSE
      let ifNot = [];
      if (TT.ELSE == tokens[0].type) {
        tokens.shift();
        removeSeperators();
        if (TT.LEFT_CRLY != tokens[0].type) {
          throw {
            token: tokens[0],
            msg: `Expected '{' after 'else'`,
          };
        }
        ifNot = parseScope();
      }
      return {
        type: TT.IF,
        scope: result,
        condition: condition,
        elif: elifs,
        else: ifNot,
      };
    }

    // Case
    if (TT.CASE == tokens[0].type) {
      tokens.shift();
      removeSeperators();
      if (TT.LEFT_CRLY != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected '{' after 'case'`,
        };
      }
      let firstCurlyForErrors = tokens.shift(); // remove {
      removeSeperators();
      let whens = [];
      while (TT.WHEN == tokens[0].type) {
        tokens.shift();
        removeSeperators();
        let condition = parseValue();
        if (!condition) {
          throw {
            token: tokens[0],
            msg: `Expected value for 'when' condition after 'when'`,
          };
        }
        removeSeperators();
        if (TT.LEFT_CRLY != tokens[0].type) {
          throw {
            token: tokens[0],
            msg: `Expected '{' after 'when' condition`,
          };
        }
        whens.push({ condition: condition, scope: parseScope() });
        removeSeperators();
      }
      let defaultResult = [];
      if (TT.DEFAULT == tokens[0].type) {
        // defalut
        tokens.shift();
        removeSeperators();
        if (TT.LEFT_CRLY != tokens[0].type) {
          throw {
            token: tokens[0],
            msg: `Expected '{' after 'default'`,
          };
        }
        defaultResult = parseScope();
        removeSeperators();
      }
      if (TT.RIGHT_CRLY != tokens[0].type) {
        throw {
          token: {},
          msg: `Unterminated case statment started on line ${firstCurlyForErrors.line} at character ${firstCurlyForErrors.charStart}`,
          end: true,
        };
      }
      tokens.shift();
      return {
        type: TT.CASE,
        whens: whens,
        default: defaultResult,
      };
    }

    //functions
    if (TT.FUN == currentToken) {
      /* fun minus(one two) {} */
      inFun += 1;
      tokens.shift();
      removeSeperators();
      if (TT.IDENTIFIER != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected identifier after 'fun'`,
        };
      }
      let name = tokens.shift().value;
      if (TT.LEFT_PREN != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected '(' after function identifier`,
        };
      }
      tokens.shift();
      removeSeperators();
      let args = [];
      while (TT.IDENTIFIER == tokens[0].type) {
        args.push(tokens.shift().value);
        removeSeperators();
      }
      if (TT.RIGHT_PREN != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected ')' after function arguments`,
        };
      }
      tokens.shift();
      removeSeperators();
      if (TT.LEFT_CRLY != tokens[0].type) {
        throw {
          token: tokens[0],
          msg: `Expected '{' after ')' in function declaration`,
        };
      }
      let result = parseScope();
      inFun -= 1;
      return {
        type: TT.FUN,
        args: args,
        scope: result,
        name: name,
      };
    }

    // remove all?
    tokens.shift();
  }
  return { AST, imports };
}
