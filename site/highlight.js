let reservedWords = [
  "val",
  "let",
  "fun",
  "return",
  "unpack",
  "if",
  "elif",
  "else",
  "case",
  "when",
  "for",
  "from",
  "to",
  "by",
  "foreach",
  "of",
  "while",
  "next",
  "exit",
  "default",
  "nil",
  "import",
];

function highlight(source) {
  let input = source;
  let output = "";

  let length;

  function addToken(colour = false) {
    if (colour) {
      output += `<span class="${colour}">${input.substring(0, length)}</span>`;
    } else {
      output += input.substring(0, length);
    }
    input = input.slice(length);
  }

  while (input != "") {
    length = 1;
    let currentChar = input[0];
    switch (currentChar) {
      case "{":
      case "}":
      case "(":
      case ")":
      case "[":
      case "]":
        addToken("BRACE");
        break
      case "&":
        if (/^&lt;|^&gt;/.test(input)) {
          length = 4;
          addToken();
        } else if (/^&amp;/.test(input)) {
          length = 5;
          addToken();
        }
        break;
      case "<":
        // <br> all other '<' are &lt;
        length = 4;
        addToken();
        break;
      case "-":
        if (input.length >= 2 && /[0-9]/.test(input[1])) {
          while (/[0-9]/.test(input[length]) && length < input.length) {
            length += 1;
          }
          if (input[length] == "." && /[0-9]/.test(input[length + 1])) {
            length += 1;
            while (/[0-9]/.test(input[length]) && length < input.length) {
                length += 1;
            }
          }
          addToken("NUMBER");
        } else {
          addToken();
        }
        break;
      case "#":
        if (input.length > 1 && input[1] == "{") {
          while (input.length >= length) {
            if (input[length] == "}" && input[length+1] == "#") {
              length += 2;
              break;
            } else {
              length += 1;
            }
          }
        } else {
          while (input.length >= length) {
            if(input[length] == "<" && input[length+1] == "b" && input[length+2] == "r" && input[length+3] == ">") {
                break
            }
            length += 1;
          }
        }
        addToken("COMMENT");
        break;
      case '"':
        while (input[length] != '"' && length < input.length) {
          if (input[length] == "\\") {
            if (
              input[length + 1] == '"' ||
              input[length + 1] == "n" ||
              input[length + 1] == "\\"
            ) {
              addToken("STRING")
              length = 2
              addToken("ESCAPE")
              length = -1;
            }
          }
          length += 1;
        }
        length += 1;
        addToken("STRING");
        break;
      default:
        if (/[A-Za-z]/.test(currentChar)) {
          let i = 1;
          while (/[A-Za-z0-9_]/.test(input[i]) && i < input.length) {
            length += 1;
            i += 1;
          }
          let value = input.substring(0, length);

          if (value == "true" || value == "false") {
            addToken("BOOL");
          } else if (value == "nil") {
            addToken("NIL");
          } else if (reservedWords.includes(value)) {
            addToken("KEYWORD");
          } else {
            if(input[length] == "(") {
                addToken("FUNCTION")
            } else {
                addToken();
            }
          }
        } else if (/[0-9]/.test(currentChar)) {
          let i = 1;
          while (/[0-9]/.test(input[i]) && i < input.length) {
            length += 1;
            i += 1;
          }
          if (input[i] == "." && /[0-9]/.test(input[i + 1])) {
            length += 1;
            i += 1;
            while (/[0-9]/.test(input[i]) && i < input.length) {
                length += 1;
              i += 1;
            }
          }
          addToken("NUMBER");
        } else {
          addToken();
        }
    }
    length += 1;
  }
  return output;
}
