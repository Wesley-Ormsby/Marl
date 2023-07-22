export function error(input, source, outFun = false, id = false) {
  let charStart = input.token.charStart;
  let charEnd = input.token.charEnd;
  let line = input.token.line;
  let end = input.end ?? false;
  let msg = input.msg;
  let calls = input.callStack ?? [];
  if (end) {
    line = source.split("\n").length;
    charStart = source.split("\n")[line - 1].length + 1;
    charEnd = source.split("\n")[line - 1].length + 1;
  }

  const reset = "\x1b[0m";
  const bright = "\x1b[1m";
  const red = "\x1b[31m";
  const blue = "\x1b[94m";

  const message = `${bright}${red}Error${reset}${bright}: ${msg}${reset}\n`;
  let callStack = `${blue}  --> ${reset}${line}:${charStart}\n`;
  for (var each of calls) {
    callStack += `${blue}  --> ${reset}${each.name} ${each.line}:${each.charStart}\n`;
  }
  const code1 = `${blue} ${" ".repeat(String(line).length)} |${reset}\n`;
  let code2 = `${blue} ${line} |${reset} `;
  let code3 = `${blue} ${" ".repeat(String(line).length)} |${reset} `;

  if (charEnd - charStart >= 40) {
    console.log("yes")
    let lineSource = source.split("\n")[line - 1];
    code2 +=
        escapeTerminalCodes(lineSource.substring(0,40)) +
        `${blue} ...${reset}` +
        "\n";
      code3 +=
        red + "^".repeat(40) +  "\n";
  } else {
    let lineSource = source.split("\n")[line - 1];
    if (lineSource.length > 40) {
      let remaining = 40 - (charEnd - charStart + 1);
      let left = Math.ceil(remaining / 2);
      let right = Math.floor(remaining / 2);
      code2 +=
        `${blue}... ${reset}` +
        escapeTerminalCodes(lineSource.substring(charStart - left - 1, charEnd + right)) +
        `${blue} ...${reset}` +
        "\n";
      code3 +=
        "    " +
        " ".repeat(left) +
        red +
        "^".repeat(charEnd - charStart + 1) +
        "\n";
    } else {
      code2 += escapeTerminalCodes(lineSource) + reset + "\n";
      code3 +=
        " ".repeat(charStart - 1) +
        red +
        "^".repeat(charEnd - charStart + 1) +
        "\n";
    }
  }

  let fullError = "\n" + message + callStack + code1 + code2 + code3;
  if (outFun) {
    outFun(fullError, id);
  } else {
    console.log(fullError);
  }
}

function escapeTerminalCodes(oldStr) {
  let newStr = "";
  while (oldStr) {
    if (/^\x1b\[/.test(oldStr)) {
      newStr += "\\x1b[";
      oldStr = oldStr.slice(2);
    } else {
      newStr += oldStr[0];
      oldStr = oldStr.slice(1);
    }
  }
  return newStr
}
