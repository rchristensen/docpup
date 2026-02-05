import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runPreprocess } from "../src/preprocess.js";
import type { RepoConfig } from "../src/types.js";

describe("runPreprocess html", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "docpup-preprocess-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("converts html and rewrites links", async () => {
    const docsDir = path.join(tempDir, "docs");
    await fs.mkdir(docsDir, { recursive: true });
    await fs.writeFile(
      path.join(docsDir, "index.html"),
      `<!doctype html><html><body><main><h1>Intro</h1><p><a href="guide.html#x">Guide</a></p></main></body></html>`,
      "utf8"
    );

    const repo: RepoConfig = {
      name: "sample",
      repo: "https://example.com/repo",
      sourcePath: "docs",
      preprocess: {
        type: "html",
        workDir: "docs",
        outputDir: "docpup-build",
        rewriteLinks: true,
      },
    };

    const outputDir = await runPreprocess(tempDir, repo);
    const outputFile = path.join(outputDir, "index.md");
    const content = await fs.readFile(outputFile, "utf8");

    expect(content).toContain("# Intro");
    expect(content).toContain("guide.md#x");
  });

  it("respects selector override", async () => {
    const docsDir = path.join(tempDir, "docs");
    await fs.mkdir(docsDir, { recursive: true });
    await fs.writeFile(
      path.join(docsDir, "index.html"),
      `<!doctype html><html><body><main><h1>Main</h1></main><article><h1>Article</h1></article></body></html>`,
      "utf8"
    );

    const repo: RepoConfig = {
      name: "sample",
      repo: "https://example.com/repo",
      sourcePath: "docs",
      preprocess: {
        type: "html",
        workDir: "docs",
        outputDir: "docpup-build",
        selector: "article",
      },
    };

    const outputDir = await runPreprocess(tempDir, repo);
    const outputFile = path.join(outputDir, "index.md");
    const content = await fs.readFile(outputFile, "utf8");

    expect(content).toContain("# Article");
    expect(content).not.toContain("# Main");
  });

  it("fails when no html files exist", async () => {
    const docsDir = path.join(tempDir, "docs");
    await fs.mkdir(docsDir, { recursive: true });

    const repo: RepoConfig = {
      name: "sample",
      repo: "https://example.com/repo",
      sourcePath: "docs",
      preprocess: {
        type: "html",
        workDir: "docs",
        outputDir: "docpup-build",
      },
    };

    await expect(runPreprocess(tempDir, repo)).rejects.toThrow(
      "produced no markdown files"
    );
  });
});
