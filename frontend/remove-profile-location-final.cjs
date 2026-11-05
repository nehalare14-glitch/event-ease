const fs = require("fs");
const ts = require("typescript");
const cp = require("child_process");

const file = "src/app/my-profile/page.tsx";
const original = fs.readFileSync(file, "utf8");
const backup = file + ".before-final-location-removal.bak";

const source = ts.createSourceFile(
  file,
  original,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

const changes = [];

const locationStates = new Set([
  "editedLocation",
  "editedCoordinates",
  "editLocationLoading",
  "detectedLocationName",
  "locationLoading",
  "locationMessage",
  "currentLocation"
]);

const locationFunctions = new Set([
  "reverseGeocodeLocation",
  "handleUseCurrentLocation",
  "handleSaveProfileLocation"
]);

function addChange(node, replacement = "") {
  changes.push({
    start: node.getStart(source),
    end: node.getEnd(),
    replacement
  });
}

function contains(node, text) {
  return node.getText(source).includes(text);
}

function visit(node) {
  if (ts.isVariableStatement(node)) {
    const names = node.declarationList.declarations.map(
      d => d.name.getText(source)
    );

    if (
      names.length > 0 &&
      names.every(name => locationStates.has(name))
    ) {
      addChange(node);
      return;
    }
  }

  if (
    ts.isFunctionDeclaration(node) &&
    node.name &&
    locationFunctions.has(node.name.text)
  ) {
    addChange(node);
    return;
  }

  if (
    ts.isIfStatement(node) &&
    contains(node.expression, "editedLocation")
  ) {
    addChange(node);
    return;
  }

  if (
    ts.isCallExpression(node) &&
    contains(node.expression, "updateDoc") &&
    contains(node, "editedCoordinates")
  ) {
    const object = node.arguments[1];

    if (object && ts.isObjectLiteralExpression(object)) {
      addChange(object, "{ name: cleanName }");
      return;
    }
  }

  // Remove the location button in Profile Tools.
  if (
    ts.isJsxElement(node) &&
    contains(node.openingElement, "button") &&
    contains(node, "handleUseCurrentLocation")
  ) {
    addChange(node);
    return;
  }

  // Remove location messages and location card.
  if (
    ts.isJsxExpression(node) &&
    (
      contains(node, "locationMessage &&") ||
      contains(node, "currentLocation &&")
    )
  ) {
    addChange(node);
    return;
  }

  // Remove the Edit Profile location form group.
  if (
    ts.isJsxElement(node) &&
    node.openingElement.tagName.getText(source) === "div" &&
    (
      contains(node, 'htmlFor="edit-location"') ||
      contains(node, 'id="edit-location"') ||
      contains(node, "handleSaveProfileLocation")
    )
  ) {
    addChange(node);
    return;
  }

  ts.forEachChild(node, visit);
}

visit(source);

// Reject overlapping changes rather than corrupting JSX.
const ordered = changes.sort((a, b) => a.start - b.start);

for (let i = 1; i < ordered.length; i++) {
  if (ordered[i].start < ordered[i - 1].end) {
    throw new Error("Overlapping edits detected. Nothing saved.");
  }
}

let result = original;

for (const change of [...ordered].reverse()) {
  result =
    result.slice(0, change.start) +
    change.replacement +
    result.slice(change.end);
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
  "editLocationLoading",
  'id="edit-location"'
];

const remaining = forbidden.filter(
  item => result.includes(item)
);

if (remaining.length) {
  console.error(
    "Location references remain:",
    remaining.join(", ")
  );
  console.error("No changes saved.");
  process.exit(1);
}

const required = [
  "handleSaveProfile",
  "handleChangePassword",
  "handleSendResetLink",
  "handleDeleteAccount",
  "Edit Profile"
];

for (const item of required) {
  if (!result.includes(item)) {
    throw new Error("Required feature missing: " + item);
  }
}

const parsed = ts.createSourceFile(
  file, result, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX
);

if (parsed.parseDiagnostics.length) {
  console.error("TSX syntax validation failed.");
  for (const error of parsed.parseDiagnostics) {
    console.error(
      ts.flattenDiagnosticMessageText(error.messageText, "\n")
    );
  }
  process.exit(1);
}

fs.copyFileSync(file, backup);
fs.writeFileSync(file, result);

console.log("Location code removed. Checking TypeScript...");

try {
  cp.execFileSync(
    "npx.cmd",
    ["tsc", "--noEmit"],
    { stdio: "inherit", shell: true }
  );

  console.log("SUCCESS: Location feature removed.");
  console.log("Backup:", backup);
} catch (error) {
  fs.copyFileSync(backup, file);
  console.error(
    "TypeScript check failed. Original profile restored."
  );
  process.exit(1);
}
