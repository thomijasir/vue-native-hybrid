import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@vue/compiler-sfc";
import { describe, expect, it } from "vitest";

const ELEMENT_NODE = 1;
const TEXT_NODE = 2;
const INTERPOLATION_NODE = 5;

type TemplateNode = {
  type: number;
  tag?: string;
  content?: string | { loc?: { source?: string } };
  children?: TemplateNode[];
  loc: {
    start: {
      line: number;
    };
  };
};

type TextViolation = {
  line: number;
  content: string;
};

const pagesDirectory = dirname(fileURLToPath(import.meta.url));
const storiesDirectory = join(pagesDirectory, "Stories");

function findPageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(directory, entry.name);

      if (path === storiesDirectory) return [];
      if (entry.isDirectory()) return findPageFiles(path);
      return entry.isFile() && entry.name.endsWith(".vue") ? [path] : [];
    })
    .sort();
}

function nodeContent(node: TemplateNode): string {
  if (typeof node.content === "string") return node.content.trim();
  return node.content?.loc?.source?.trim() ?? "";
}

function findUnwrappedText(source: string, filename: string): TextViolation[] {
  const { descriptor, errors } = parse(source, { filename });
  expect(errors).toEqual([]);

  const root = descriptor.template?.ast as TemplateNode | undefined;
  if (!root) return [];

  const violations: TextViolation[] = [];

  function visit(node: TemplateNode, ancestors: TemplateNode[]) {
    const isVisibleText =
      (node.type === TEXT_NODE && nodeContent(node).length > 0) ||
      node.type === INTERPOLATION_NODE;
    const hasTextAncestor = ancestors.some(
      (ancestor) => ancestor.type === ELEMENT_NODE && ancestor.tag === "Text",
    );

    if (isVisibleText && !hasTextAncestor) {
      violations.push({
        line: node.loc.start.line,
        content: nodeContent(node),
      });
    }

    for (const child of node.children ?? []) {
      visit(child, [...ancestors, node]);
    }
  }

  visit(root, []);
  return violations;
}

describe("non-Story page text usage", () => {
  it("detects static and interpolated text rendered outside Text", () => {
    const violations = findUnwrappedText(
      `<template>
        <main>
          <p>Raw copy</p>
          <span>{{ message }}</span>
        </main>
      </template>`,
      "Example.page.vue",
    );

    expect(violations.map(({ content }) => content)).toEqual([
      "Raw copy",
      "message",
    ]);
  });

  it("allows Text content and ignores textual attributes or props", () => {
    const violations = findUnwrappedText(
      `<template>
        <main aria-label="Account">
          <Text variant="body1">Welcome {{ name }}</Text>
          <Input label="Email" placeholder="you@example.com" />
        </main>
      </template>`,
      "Example.page.vue",
    );

    expect(violations).toEqual([]);
  });

  it("requires all non-Story page template text to use Text", () => {
    const violations = findPageFiles(pagesDirectory).flatMap((filename) =>
      findUnwrappedText(readFileSync(filename, "utf8"), filename).map(
        (violation) =>
          `${relative(pagesDirectory, filename)}:${violation.line} ${violation.content}`,
      ),
    );

    expect(violations).toEqual([]);
  });
});
