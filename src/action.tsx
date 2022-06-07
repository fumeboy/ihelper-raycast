import { Alert, Clipboard, closeMainWindow, confirmAlert } from "@raycast/api";
import { runAppleScript } from "run-applescript";
import { dictfile, dictLine } from "./databaseclient";

export { action, actionEditDict };

function actionEditDict() {
  runAppleScript(`set targetFilepath to "${dictfile}"
    tell application "TextEdit"
      activate
      open targetFilepath
    end tell`);
}

async function action(item: dictLine) {
  if (item.output.length == 0) {
    return;
  }
  let a = actionmap.get(item.type);
  let b = false;
  if (a) {
    if (!a(item.output)) {
      b = true;
    }
  } else {
    b = true;
  }
  if (b) {
    const options: Alert.Options = {
      title: "could not exec this action",
      message: "please check your dictonary",
      primaryAction: {
        title: "open dictonary",
        onAction: () => {
          actionEditDict();
        },
      },
    };
    await confirmAlert(options);
  }

  closeMainWindow({ clearRootSearch: true });
}

let actionmap = new Map([
  ["1", action1],
  ["2", action2],
  ["3", action3],
]);

function action1(text: string) {
  runAppleScript(`tell application "System Events"
  keystroke "${text}"
end`)
  return true;
}

function action2(expr: string) {
  const keys = expr.split("+").map((k) => k.trim());
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
      return false;
    }
    press = m[-1];
    m = m.slice(0, -1);
  }
  const kcode = keycode.get(press.toUpperCase());
  if (kcode == undefined) {
    return false;
  }
  const applescript = `tell application "System Events"
key code ${kcode} using {${m.map((s) => s + " down").join(",")}}
end`;
  runAppleScript(applescript);
  return true;
}

function action3(json: string) {
  let arr = JSON.parse(`[${json}]`);
  for (let item of arr) {
    if (item.length != 2) {
      return false;
    }
    let type = "";
    if (typeof item[0] == "number") {
      type = String(item[0]);
    }
    if (typeof item[0] == "string") {
      type = item[0];
    }
    let a = actionmap.get(type);
    if (a) {
      if (!a(item[1])) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

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
  ["SPACE", "49"],
]);
