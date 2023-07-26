function changeExample(select) {
    const newExample = select.value
    const exampleDic = {
      helloworld:`# hello world\nprint("Hello, world!")`,
      FizzBuzz: `for i from 1 to 100 {\n\tcase {\n\t\twhen [i 15 % 0 ==] {\n\t\t\tprint("FizzBuzz")\n\t\t}\n\t\twhen [i 3 % 0 ==] {\n\t\t\tprint("Fizz")\n\t\t}\n\t\twhen [i 5 % 0 ==] {\n\t\t\tprint("Buzz")\n\t\t}\n\t\tdefault {\n\t\t\tprint(i)\n\t\t}\n\t}\n}`,
      factorial: `fun factorial(x) {\n\tif [x 0 == x 1 == |] {\n\t\treturn 1\n\t} else {\n\t\treturn [x factorial([x 1 -]) *]\n\t}\n}\n\nlet number = 4\nprint(factorial(number))`
    }
    document.querySelector("#examples textarea").value = exampleDic[newExample]
    document.querySelector("#examples .consoleText").innerText = ""
    update(document.querySelector("#examples textarea"))
  }
  function createCodes() {
    const allCodes = document.querySelectorAll(".code");
    let id = 0;
    for (var code of allCodes) {
      let toHighlight = code.innerText;
      id += 1;
      code.innerHTML = `<div class="block" id="id${id}">
  <div class="centerEditor">
    <div class="lines">1</div>
    <div class="typeingArea">
      <textarea
        spellcheck="false"
        autocapitalize="none"
        oninput="update(this); syncScroll(this);"
        onscroll="syncScroll(this);"
        onkeydown="check_tab(this, event);"
      >${toHighlight}</textarea>
      <pre class="forground"></pre>
    </div>
  </div><div class="console">
    <div class="run" onclick="runWithInput(${id})">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="0.9375"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-play"
      >
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    </div>
    <div class="consoleTextDiv">
      <p class="consoleText"></p>
    </div>
  </div>
</div>`;
      update(code.querySelector("textarea"));
    }
  }

  function output(value, id, trial) {
    const reset = /^\x1b\[0m/;
    const bright = /^\x1b\[1m/;
    const red = /^\x1b\[31m/;
    const blue = /^\x1b\[94m/;
    const purple = /^\x1b\[35m/;
    const escaped = /^\\x1b\[/;

    const newBlue = "#3B8EEA";
    const newRed = "#F14C4C";
    const newPurple = "#C965C9";

    let oldText = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    let newText = "";
    let resets = 0;
    while (oldText) {
      if (bright.test(oldText)) {
        newText += '<span style="font-weight:bold">';
        oldText = oldText.slice(4);
        resets += 1;
      } else if (red.test(oldText)) {
        newText += `<span style="color:${newRed}">`;
        oldText = oldText.slice(5);
        resets += 1;
      } else if (blue.test(oldText)) {
        newText += `<span style="color:${newBlue}">`;
        oldText = oldText.slice(5);
        resets += 1;
      } else if (purple.test(oldText)) {
        newText += `<span style="color:${newPurple}">`;
        oldText = oldText.slice(5);
        resets += 1;
      } else if (escaped.test(oldText)) {
        newText += oldText.subStr(0, 5);
        oldText = oldText.slice(5);
      } else if (reset.test(oldText)) {
        oldText = oldText.slice(4);
        newText += "</span>".repeat(resets);
        resets += 0;
      } else {
        newText += oldText[0];
        oldText = oldText.slice(1);
      }
    }
    document.querySelector(`#id${id} .consoleText`).innerHTML +=
      newText + trial;
  }
  async function runWithInput(id) {
    let textarea = document.querySelector(`#id${id} textarea`);
    import("./../src/marl.js").then((module) => {
      module.marl(textarea.value, output, id);
    });
    marl(textarea.value, output, id)
  }

  function update(textarea) {
    let value = textarea.value;
    if(value[value.length-1] == "\n") {
        value += " ";
      }
    let forground = textarea;
    while (forground.nodeName != "PRE") {
      forground = forground.nextSibling;
    }
    let lines = textarea.parentNode;
    while (lines.className != "lines") {
      lines = lines.previousSibling;
    }
    let newValue = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
    forground.innerHTML = highlight(newValue); //highlight(newValue);

    lines.innerHTML = [...Array(value.split("\n").length).keys()]
      .map((x) => x + 1)
      .join("<br>");
  }

  function check_tab(element, event) {
    let code = element.value;
    if (event.key == "Tab") {
      event.preventDefault(); // stop normal event
      let before_tab = code.slice(0, element.selectionStart); // text before tab
      let after_tab = code.slice(
        element.selectionEnd,
        element.value.length
      ); // text after tab
      let cursor_pos = element.selectionStart + 1; // where cursor moves after tab - moving forward by 1 char to after tab
      element.value = before_tab + "\t" + after_tab; // add tab char
      // move cursor
      element.selectionStart = cursor_pos;
      element.selectionEnd = cursor_pos;
      update(element); // Update text to include indent
    }
  }

  function syncScroll(element) {
    let forground = element.nextSibling;
    while (forground.nodeName != "PRE") {
      forground = forground.nextSibling;
    }
    let lines = element.parentNode;
    while (lines.className != "lines") {
      lines = lines.previousSibling;
    }
    // Get and set x and y
    forground.scrollTop = element.scrollTop;
    forground.scrollLeft = element.scrollLeft;
    lines.scrollTop = element.scrollTop;
  }