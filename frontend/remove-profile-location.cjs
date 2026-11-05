const fs = require("fs");
const ts = require("typescript");

const path = "src/app/my-profile/page.tsx";
const original = fs.readFileSync(path, "utf8");
const source = ts.createSourceFile(
  path, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX
);

const removals = [];
const replacements = [];

function remove(node) {
  removals.push([node.getFullStart(), node.getEnd()]);
}

function replace(node, value) {
  replacements.push([node.getStart(source), node.getEnd(), value]);
}

function hasText(node, value) {
  return node.getText(source).includes(value);
}

function visit(node) {
  if (ts.isVariableStatement(node)) {
    const names = node.declarationList.declarations.map(
      d => d.name.getText(source)
    );

    const locationNames = [
      "editedLocation",
      "editedCoordinates",
      "editLocationLoading",
      "detectedLocationName",
      "locationLoading",
      "locationMessage",
      "currentLocation"
    ];

    if (names.length && names.every(n => locationNames.includes(n))) {
      remove(node);
      return;
    }
  }

  if (ts.isFunctionDeclaration(node) && node.name) {
    if ([
      "reverseGeocodeLocation",
      "handleUseCurrentLocation",
      "handleSaveProfileLocation"
    ].includes(node.name.text)) {
      remove(node);
      return;
    }
  }

  if (ts.isIfStatement(node) &&
      hasText(node.expression, "editedLocation")) {
    remove(node);
    return;
  }

  if (ts.isCallExpression(node) &&
      hasText(node.expression, "updateDoc") &&
      hasText(node, "editedCoordinates")) {
    const args = node.arguments;
    const object = args[1];

    if (object && ts.isObjectLiteralExpression(object)) {
      replace(object, "{ name: cleanName }");
      return;
    }
  }

  ts.forEachChild(node, visit);
}

visit(source);

const changes = [
  ...removals.map(([start, end]) => [start, end, ""]),
  ...replacements
].sort((a, b) => b[0] - a[0]);

let result = original;

for (const [start, end, value] of changes) {
  result = result.slice(0, start) + value + result.slice(end);
}

fs.writeFileSync(path + ".location-cleanup-preview", result);

console.log("Code cleanup preview created.");
console.log("Changes:", changes.length);
