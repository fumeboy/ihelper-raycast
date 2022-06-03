import { ActionPanel, List, Action, Clipboard, closeMainWindow, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import fs = require("fs");
import os = require("os");
import { runAppleScript } from "run-applescript";
const filecontent: { tag: string; desc: string; output: string; iftext: boolean }[] = [];

const dictfile = os.homedir() + "/.ihelper.csv";

function loaddict() {
  fs.readFile(dictfile, "utf8", (err, data) => {
    if (err != null) {
      fs.writeFile(dictfile, "", { flag: "a" }, () => null);
    }
    if (data == null) {
      return;
    }
    const lines = data.split(/\r?\n/);
    for (const l of lines) {
      const r = parseCSVline(l);
      if (r != null) {
        filecontent.push(r);
      }
    }
  });
}
loaddict();

const keycode = new Map([
  ["1", "18"],
  ["2", "19"],
  ["3", "20"],
  ["4", "21"],
  ["5", "23"],
  ["6", "22"],
  ["7", "26"],
  ["8", "28"],
  ["9", "25"],
  ["0", "29"],
  ["`", "50"],
  ["[", "33"],
  ["]", "30"],
  ['"', "42"],
  [";", "41"],
  ["'", "39"],
  ["-", "27"],
  ["+", "24"],
  [",", "43"],
  [".", "47"],
  ["/", "44"],
  ["N", "45"],
  ["M", "46"],
  ["Q", "12"],
  ["W", "13"],
  ["E", "14"],
  ["R", "15"],
  ["T", "17"],
  ["Y", "16"],
  ["U", "32"],
  ["I", "34"],
  ["O", "31"],
  ["P", "35"],
  ["A", "0"],
  ["S", "1"],
  ["D", "2"],
  ["F", "3"],
  ["G", "5"],
  ["H", "4"],
  ["J", "38"],
  ["K", "40"],
  ["L", "37"],
  ["Z", "6"],
  ["X", "7"],
  ["C", "8"],
  ["V", "9"],
  ["B", "11"],
  ["ESC", "53"],
  ["CONTROL", "59"],
  ["OPTION", "58"],
  ["COMMAND", "55"],
  ["SHIFT", "56"],
]);

function parseCSVline(l: string) {
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
    return null;
  }
  switch (spans[3]) {
    case "1":
      return { tag: spans[0], desc: spans[1], output: spans[2], iftext: true };
    case "2":
      return { tag: spans[0], desc: spans[1], output: spans[2], iftext: false };
    default:
      return { tag: spans[0], desc: spans[1], output: spans[2], iftext: true };
  }
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function getitems(origin: string) {
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
  const r: { tag: string; desc: string; output: string; iftext: boolean }[] = [];
  for (const l of filecontent) {
    if (l.tag.match(reexp)) {
      r.push(l);
    }
  }
  return r;
}

export default function CommandSearch() {
  const [searchText, setSearchText] = useState("");
  const [filteredList, setFilteredList] = useState(
    [] as { tag: string; desc: string; output: string; iftext: boolean }[]
  );
  useEffect(() => {
    setFilteredList(getitems(searchText));
  }, [searchText]);
  return (
    <List
      enableFiltering={false}
      onSearchTextChange={setSearchText}
      navigationTitle="ihelper"
      searchBarPlaceholder="help remember command or hotkey and output them quickly"
    >
      {filteredList.map((item) => {
        return (
          <List.Item
            key={item.output + item.desc}
            icon={item.iftext ? "↩︎" : Icon.Circle}
            title={item.desc}
            subtitle={item.tag}
            accessories={[{ text: item.output }]}
            actions={
              <ActionPanel>
                <Action
                  title="output"
                  onAction={() => {
                    if (item.iftext) {
                      Clipboard.paste(item.output);
                    } else {
                      const keys = item.output.split("+");
                      if (keys[-1] == "plus") {
                        keys[-1] = "+";
                      }
                      let press = "";
                      const modifys = [false, false, false, false]; // cmd, ctrl, option, shift
                      for (const k of keys) {
                        switch (k) {
                          case "cmd":
                          case "command":
                            modifys[0] = true;
                            break;
                          case "ctrl":
                          case "control":
                            modifys[1] = true;
                            break;
                          case "option":
                            modifys[2] = true;
                            break;
                          case "shift":
                            modifys[3] = true;
                            break;
                          default:
                            press = k;
                        }
                      }
                      let m = [];
                      if (modifys[0]) {
                        m.push("command");
                      }
                      if (modifys[1]) {
                        m.push("control");
                      }
                      if (modifys[2]) {
                        m.push("option");
                      }
                      if (modifys[3]) {
                        m.push("shift");
                      }
                      if (press == "") {
                        if (m.length == 0) {
                          return;
                        }
                        press = m[-1];
                        m = m.slice(0, -1);
                      }
                      const kcode = keycode.get(press.toUpperCase());
                      if (kcode == undefined) {
                        return;
                      }
                      const applescript = `tell application "System Events"
                    key code ${kcode} using {${m.map((s) => s + " down").join(",")}}
                end`;
                      runAppleScript(applescript);
                    }
                    closeMainWindow({ clearRootSearch: true });
                  }}
                />
                <ActionPanel.Section title="dict">
                  <Action title="reload dict" onAction={() => loaddict()} shortcut={{ modifiers: ["cmd"], key: "s" }} />
                  <Action
                    title="edit dict"
                    onAction={() =>
                      runAppleScript(`set targetFilepath to "${dictfile}"
                    tell application "TextEdit"
                        activate
                        open targetFilepath
                    end tell`)
                    }
                    shortcut={{ modifiers: ["cmd"], key: "w" }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
