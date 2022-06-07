import examplecsv from "./dict.example.json";
import fs = require("fs");
import os = require("os");

export { dictfile, loaddict, getItems };
export type {dictLine}

type dictLine = { lineNo: number; tag: string; desc: string; output: string; type: string };

const filecontent: dictLine[] = [];
const dictfile = os.homedir() + "/.ihelper.csv";

function loaddict() {
  fs.readFile(dictfile, "utf8", (err, data) => {
    if (err != null) {
      data = (examplecsv as string[]).join("\n");
      fs.writeFile(dictfile, data, { flag: "a+", mode: 0o777 }, (err) => console.log(err));
    }
    if (data == null) {
      return;
    }
    const lines = data.split(/\r?\n/);
    for (const [index, l] of lines.entries()) {
      const r = parseCSVline(l);
      if (r != undefined) {
        r.lineNo = index;
        filecontent.push(r);
      }
    }
  });
}

loaddict(); // init

function parseCSVline(l: string): dictLine | undefined {
  const spans = ["", "", "", ""];
  let spanIndex = 0;
  let openclose = false;
  for (const char of [...(l + ",")]) {
    switch (char) {
      case '"':
        if (openclose == false) {
          openclose = true;
        } else {
          openclose = false;
          spans[spanIndex] += '"';
        }
        break;
      case ",":
        if (openclose == false) {
          if (spans[spanIndex].slice(-1) == '"') {
            spans[spanIndex] = spans[spanIndex].slice(0, -1);
          }
          if (spanIndex == 3) {
            break;
          }
          spanIndex += 1;
        } else {
          spans[spanIndex] += ",";
        }
        break;
      default:
        spans[spanIndex] += String(char);
    }
  }

  if (spans[1].length == 0) {
    return undefined;
  }
  return { lineNo: 0, tag: spans[0], desc: spans[1], output: spans[2], type: spans[3] };
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function getItems(origin: string) {
  if (origin === "" || origin === undefined) {
    return [];
  }
  const keywords = origin.split(";");
  let reexp = "";
  for (const [i, k] of keywords.entries()) {
    // (?=.*key1).*;(?=.*key2).*;(?=.*key3)
    reexp += "(?=.*" + escapeRegExp(k) + ")";
    if (i != keywords.length - 1) {
      reexp += ".*;";
    }
  }
  const r: dictLine[] = [];
  for (const l of filecontent) {
    if (l.tag.match(reexp)) {
      r.push(l);
    }
  }
  return r;
}
