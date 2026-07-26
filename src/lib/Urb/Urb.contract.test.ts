import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../../..");

describe("URB native bridge contract", () => {
  it("keeps Android command names aligned with TypeScript commands", () => {
    const types = readFileSync(
      resolve(root, "src/lib/Urb/Urb.interface.ts"),
      "utf8",
    );
    const typeCommandNames = [
      ...commandNamesInType(types, "UrbSendCommands"),
      ...commandNamesInType(types, "UrbFireCommands"),
    ].sort();
    const androidCommandNames = recursiveFiles(
      resolve(root, "android/app/src/main/java/com/example/mywebview/urb/commands"),
    )
      .filter((file) => file.endsWith(".kt"))
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        return [...source.matchAll(/override val name = "([^"]+)"/g)].map(
          ([, name]) => name,
        );
      })
      .sort();

    expect(androidCommandNames).toEqual(typeCommandNames);
  });

  it("keeps iOS command names aligned with the intended iOS URB surface", () => {
    const iosCommandNames = recursiveFiles(resolve(root, "ios/App/URB"))
      .filter((file) => file.endsWith(".swift"))
      .flatMap((file) => {
        const source = readFileSync(file, "utf8");
        return [...source.matchAll(/let name = "([^"]+)"/g)].map(
          ([, name]) => name,
        );
      })
      .sort();

    expect(iosCommandNames).toEqual(
      [
        "biometrics:authenticate",
        "biometrics:getAvailability",
        "browser:open",
        "camera:capture",
        "clipboard:getText",
        "clipboard:setText",
        "device:info",
        "document:pick",
        "fetch",
        "intent:open",
        "intent:openForResult",
        "location:current",
        "location:pick",
        "media:pick",
        "network:getStatus",
        "permissions:get",
        "permissions:request",
        "secureStorage:clear",
        "secureStorage:delete",
        "secureStorage:get",
        "secureStorage:set",
        "websocket:close",
        "websocket:open",
        "websocket:send",
      ].sort(),
    );
  });
});

const commandNamesInType = (source: string, typeName: string) => {
  const start = source.indexOf(`export type ${typeName} = {`);
  expect(start).toBeGreaterThanOrEqual(0);
  const bodyStart = source.indexOf("{", start) + 1;
  const bodyEnd = matchingBraceEnd(source, bodyStart - 1);
  const body = source.slice(bodyStart, bodyEnd);

  return [...body.matchAll(/^ {2}(?:"([^"]+)"|([a-zA-Z][\w]*)):/gm)].map(
    ([, quoted, bare]) => quoted ?? bare,
  );
};

const matchingBraceEnd = (source: string, openBraceIndex: number) => {
  let depth = 0;
  for (let index = openBraceIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  throw new Error("Unable to find matching type brace");
};

const recursiveFiles = (directory: string): string[] => {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? recursiveFiles(path) : [path];
  });
};
