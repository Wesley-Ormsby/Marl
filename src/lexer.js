import { TT } from "./TT.js";

export function lex(source) {
  let reservedWords = {
    val: "VAL",
    let: "LET",
    fun: "FUN",
    return: "RETURN",
    unpack: "UNPACK",
    if: "IF",
    elif: "ELIF",
    else: "ELSE",
    case: "CASE",
    when: "WHEN",
    for: "FOR",
    from: "FROM",
    to: "TO",
    by: "BY",
    foreach: "FOREACH",
    of: "OF",
    while: "WHILE",
    next: "NEXT",
    exit: "EXIT",
    default: "DEFAULT",
    nil: "NIL",
    import: "IMPORT"
  };

  let input = source;
  let tokens = [];

  let char = 1;
  let line = 1;
  let charEnd = 1;
  let lineEnd = 1;
  let length;

  function consume() {
    charEnd += 1;
    length += 1;
  }

  function addToken(type) {
    tokens.push({
      type: type,
      value: input.substring(0, length),
      charStart: char,
      charEnd: charEnd,
      line: line,
    });

    char = charEnd + 1; // deep copies
    line = lineEnd + 0;
    input = input.slice(length);
  }

  function seek(nextChar) {
    return input.length > 1 ? input[1] == nextChar : false;
  }

  while (input != "") {
    length = 1;
    let currentChar = input[0];
    switch (currentChar) {
      case "+":
        addToken(TT.PLUS);
        break;
      case "*":
        addToken(TT.STAR);
        break;
      case "^":
        addToken(TT.POWER);
        break;
      case "%":
        addToken(TT.MOD);
        break;
      case "-":
        if (input.length >= 2 && /[0-9]/.test(input[1])) {
          let i = 1;
          while (/[0-9]/.test(input[i]) && i < input.length) {
            consume();
            i += 1;
          }
          if (input[i] == "." && /[0-9]/.test(input[i + 1])) {
            consume();
            i += 1;
            while (/[0-9]/.test(input[i]) && i < input.length) {
              consume();
              i += 1;
            }
          }
          addToken(TT.NUMBER);
        } else {
          addToken(TT.MINUS);
        }
        break;
      case "&":
        addToken(TT.AND);
        break;
      case "|":
        addToken(TT.OR);
        break;
      case "!":
        addToken(TT.NOT);
        break;
      case ".":
        addToken(TT.DOT);
        break;
      case "(":
        addToken(TT.LEFT_PREN);
        break;
      case ")":
        addToken(TT.RIGHT_PREN);
        break;
      case "[":
        addToken(TT.LEFT_SQR);
        break;
      case "]":
        addToken(TT.RIGHT_SQR);
        break;
      case "{":
        addToken(TT.LEFT_CRLY);
        break;
      case "}":
        addToken(TT.RIGHT_CRLY);
        break;
      case "=":
        if (seek("=")) {
          consume();
          addToken(TT.EQUAL);
        } else {
          addToken(TT.ASSIGN);
        }
        break;
      case ">":
        if (seek("=")) {
          consume();
          addToken(TT.GREATER_EQUAL);
        } else {
          addToken(TT.GREATER);
        }
        break;
      case "<":
        if (seek("=")) {
          consume();
          addToken(TT.LESS_EQUAL);
        } else {
          addToken(TT.LESS);
        }
        break;
      case "/":
        if (seek("/")) {
          consume();
          addToken(TT.FLOOR);
        } else {
          addToken(TT.SLASH);
        }
        break;
      case "\n":
        addToken(TT.SEPERATOR)
        line += 1;
        lineEnd += 1;
        char = 1;
        charEnd = 0;
        break;
      case " ":
      case "\t":
        addToken(TT.SEPERATOR)
        break;
      case "#":
        if (seek("{")) {
          while (input.length >= 2) {
            if (input[0] == "}" && input[1] == "#") {
              input = input.slice(2);
              char += 2;
              charEnd = char - 1;
              break;
            }

            if (input[0] == "\n") {
              line += 1;
              lineEnd += 1;
              char = 1;
              charEnd = 0;
              input = input.slice(1);
            } else {
              input = input.slice(1);
              char += 1;
            }
          }
        } else {
          input = input.slice(1);
          char += 1;
          while (input.length >= 1 && input[0] != "\n") {
            input = input.slice(1);
          }
          // break and run new line stuff at next lex
        }
        break;
      case '"':
        let i = 1;
        while (input[i] != '"' && i < input.length) {
          if(input[i] == "\\") {
            if(input[i+1] == "\"" || input[i+1] == "n" || input[i+1] == "\\") {
              consume()
              i += 1
            }
          } else if (input[i] == "\n") {
            lineEnd += 1;
            charEnd = -1; // it is incremented to 0 by the following consume
          }
          consume();
          i += 1;
        }
        if (input[i] == '"') {
          consume();
          addToken(TT.STRING);
        } else {
          throw {
            token: {},
            msg: `Unterminated string started on line ${line} at character ${char}`,
            end: true
          };
        }
        break;
      default:
        if (/[A-Za-z]/.test(currentChar)) {
          let i = 1;
          while (/[A-Za-z0-9_]/.test(input[i]) && i < input.length) {
            consume();
            i += 1;
          }
          let value = input.substring(0, length);

          if (value == "true" || value == "false") {
            addToken(TT.BOOL);
          } else if (value == "nil") {
            addToken(TT.NIL);
          } else if (typeof reservedWords[value] != "undefined" && typeof reservedWords[value] != "function") {
            addToken(reservedWords[value]);
          } else {
            addToken(TT.IDENTIFIER);
          }
        } else if (/[0-9]/.test(currentChar)) {
          let i = 1;
          while (/[0-9]/.test(input[i]) && i < input.length) {
            consume();
            i += 1;
          }
          if (input[i] == "." && /[0-9]/.test(input[i + 1])) {
            consume();
            i += 1;
            while (/[0-9]/.test(input[i]) && i < input.length) {
              consume();
              i += 1;
            }
          }
          addToken(TT.NUMBER);
        } else {
          throw {
            token: {
              charStart: char,
              line: line,
              charEnd: charEnd,
            },
            msg: `Invalid character`,
          };
        }
    }
    consume();
  }
  tokens.push({ type: TT.EOF, line: lineEnd, charStart: charEnd, charEnd: charEnd }); 
  return tokens;
}
