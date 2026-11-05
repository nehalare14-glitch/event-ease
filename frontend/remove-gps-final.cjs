const fs = require("fs");
const ts = require("typescript");
const cp = require("child_process");

const file = "src/app/my-profile/page.tsx";
const original = fs.readFileSync(file, "utf8");
const backup = file + ".before-gps-removal.bak";

const source = ts.createSourceFile(
  file, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX
);

const edits = [];

const states = new Set([
  "editedLocation",
  "editedCoordinates",
  "editLocationLoading",
  "detectedLocationName",
  "locationLoading",
  "locationMessage",
  "currentLocation"
]);

const functions = new Set([
  "reverseGeocodeLocation",
  "handleUseCurrentLocation",
  "handleSaveProfileLocation"
]);

function add(node, value = "") {
  edits.push({
    start: node.getStart(source),
    end: node.getEnd(),
    value
  });
}

function text(node) {
  return node.getText(source);
}

function walk(node) {
  if (ts.isVariableDeclaration(node) &&
      states.has(text(node.name))) {
    const statement = node.parent.parent;
    add(statement);
    return;
  }

  if (ts.isFunctionDeclaration(node) &&
      node.name &&
      functions.has(node.name.text)) {
    add(node);
    return;
  }

  if (ts.isIfStatement(node) &&
      text(node.expression).includes("editedLocation")) {
    add(node);
    return;
  }

  if (ts.isCallExpression(node) &&
      text(node.expression).includes("updateDoc") &&
      text(node).includes("editedCoordinates")) {
    const object = node.arguments[1];
    if (object && ts.isObjectLiteralExpression(object)) {
      add(object, "{ name: cleanName }");
      return;
    }
  }

  if (ts.isJsxElement(node)) {
    const tag = text(node.openingElement.tagName);
    const value = text(node);

    if (tag === "button" &&
        value.includes("handleUseCurrentLocation")) {
      add(node);
      return;
    }

    if (tag === "div" &&
        value.includes('id="edit-location"') &&
        value.includes("handleSaveProfileLocation")) {
      add(node);
      return;
    }
  }

  if (ts.isJsxExpression(node)) {
    const value = text(node);

    if (
      value.includes("locationMessage &&") ||
      value.includes("currentLocation &&")
    ) {
      add(node);
      return;
    }
  }

  ts.forEachChild(node, walk);
}

walk(source);

edits.sort((a, b) => a.start - b.start);

for (let i = 1; i < edits.length; i++) {
  if (edits[i].start < edits[i - 1].end) {
    throw new Error("Overlapping edits. No changes saved.");
  }
}

let result = original;

for (const edit of [...edits].reverse()) {
  result =
    result.slice(0, edit.start) +
    edit.value +
    result.slice(edit.end);
}

result = result.replace(
  "Manage your profile and location.",
  "Manage your personal information."
);

const forbidden = [
  "navigator.geolocation",
  "reverseGeocodeLocation",
  "handleUseCurrentLocation",
  "handleSaveProfileLocation",
  "editedLocation",
  "editedCoordinates",
  "currentLocation",
  "locationLoading",
  "locationMessage",
  "detectedLocationName",
  "editLocationLoading"
];

const remaining = forbidden.filter(
  value => result.includes(value)
);

if (remaining.length) {
  console.error("Remaining location code:", remaining.join(", "));
  process.exit(1);
}

const required = [
  "handleSaveProfile",
  "handleChangePassword",
  "handleSendResetLink",
  "handleDeleteAccount",
  "Edit Profile"
];

for (const value of required) {
  if (!result.includes(value)) {
    throw new Error("Required feature missing: " + value);
  }
}

const parsed = ts.createSourceFile(
  file, result, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX
);

if (parsed.parseDiagnostics.length) {
  console.error("TSX syntax validation failed.");
  process.exit(1);
}

fs.copyFileSync(file, backup);
fs.writeFileSync(file, result);

try {
  cp.execSync("npx tsc --noEmit", {
    stdio: "inherit",
    shell: true
  });

  console.log("SUCCESS: Location access removed.");
  console.log("Backup:", backup);
} catch {
  fs.copyFileSync(backup, file);
  console.error("TypeScript failed. Original restored.");
  process.exit(1);
}
