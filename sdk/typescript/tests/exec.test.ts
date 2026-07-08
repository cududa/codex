import * as child_process from "node:child_process";
import { EventEmitter } from "node:events";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";

import { describe, expect, it } from "@jest/globals";

jest.mock("node:child_process", () => {
  const actual = jest.requireActual<typeof import("node:child_process")>("node:child_process");
  return { ...actual, spawn: jest.fn() };
});

const _actualChildProcess =
  jest.requireActual<typeof import("node:child_process")>("node:child_process");
const spawnMock = child_process.spawn as jest.MockedFunction<typeof _actualChildProcess.spawn>;

class FakeChildProcess extends EventEmitter {
  stdin = new PassThrough();
  stdout = new PassThrough();
  stderr = new PassThrough();
  killed = false;

  kill(): boolean {
    this.killed = true;
    return true;
  }
}

function createEarlyExitChild(exitCode = 2): FakeChildProcess {
  const child = new FakeChildProcess();
  setImmediate(() => {
    child.stderr.write("boom");
    child.emit("exit", exitCode, null);
    setImmediate(() => {
      child.stdout.end();
      child.stderr.end();
    });
  });
  return child;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("CodexExec", () => {
  it("resolves a legacy self-contained @cududa/codex vendor tree as compatibility", async () => {
    const { __testing } = await import("../src/exec");
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-sdk-self-contained-"));
    try {
      const packageRoot = path.join(tmpDir, "package");
      const targetTriple =
        process.platform === "win32"
          ? "aarch64-pc-windows-msvc"
          : process.platform === "darwin"
            ? "aarch64-apple-darwin"
            : "aarch64-unknown-linux-musl";
      const codexBinaryName = process.platform === "win32" ? "codex.exe" : "codex";
      const vendorRoot = path.join(packageRoot, "vendor");
      const binaryDir = path.join(vendorRoot, targetTriple, "codex");

      fs.mkdirSync(binaryDir, { recursive: true });
      fs.writeFileSync(path.join(packageRoot, "package.json"), "{}");
      fs.writeFileSync(path.join(binaryDir, codexBinaryName), "");

      expect(
        __testing.resolveVendorRoot(
          path.join(packageRoot, "package.json"),
          "@cududa/codex-missing-platform-package",
          targetTriple,
        ),
      ).toBe(vendorRoot);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("resolves a self-contained @cududa/codex package-layout vendor tree", async () => {
    const { __testing, resolveNativePackage } = await import("../src/exec");
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-sdk-self-contained-"));
    try {
      const packageRoot = path.join(tmpDir, "package");
      const targetTriple =
        process.platform === "win32"
          ? "aarch64-pc-windows-msvc"
          : process.platform === "darwin"
            ? "aarch64-apple-darwin"
            : "aarch64-unknown-linux-musl";
      const codexBinaryName = process.platform === "win32" ? "codex.exe" : "codex";
      const vendorRoot = path.join(packageRoot, "vendor");
      const packageLayoutRoot = path.join(vendorRoot, targetTriple);
      const binaryDir = path.join(packageLayoutRoot, "bin");
      const pathDir = path.join(packageLayoutRoot, "codex-path");
      const rgBinaryName = process.platform === "win32" ? "rg.exe" : "rg";

      fs.mkdirSync(binaryDir, { recursive: true });
      fs.mkdirSync(pathDir, { recursive: true });
      fs.writeFileSync(path.join(packageRoot, "package.json"), "{}");
      fs.writeFileSync(path.join(packageLayoutRoot, "codex-package.json"), "{}");
      fs.writeFileSync(path.join(binaryDir, codexBinaryName), "");
      fs.writeFileSync(path.join(pathDir, rgBinaryName), "");

      expect(
        __testing.resolveVendorRoot(
          path.join(packageRoot, "package.json"),
          "@cududa/codex-missing-platform-package",
          targetTriple,
        ),
      ).toBe(vendorRoot);
      expect(resolveNativePackage(vendorRoot, targetTriple, codexBinaryName)).toEqual({
        executablePath: path.join(binaryDir, codexBinaryName),
        pathDirs: [pathDir],
      });
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects when exit happens before stdout closes", async () => {
    const { CodexExec } = await import("../src/exec");
    const child = createEarlyExitChild();
    spawnMock.mockReturnValue(child as unknown as child_process.ChildProcess);

    const exec = new CodexExec("codex");
    const runPromise = (async () => {
      for await (const _ of exec.run({ input: "hi" })) {
        // no-op
      }
    })().then(
      () => ({ status: "resolved" as const }),
      (error) => ({ status: "rejected" as const, error }),
    );

    const result = await Promise.race([
      runPromise,
      delay(500).then(() => ({ status: "timeout" as const })),
    ]);

    expect(result.status).toBe("rejected");
    if (result.status === "rejected") {
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toMatch(/Codex Exec exited/);
    }
  });

  it("places resume args before image args", async () => {
    const { CodexExec } = await import("../src/exec");
    spawnMock.mockClear();
    const child = new FakeChildProcess();
    spawnMock.mockReturnValue(child as unknown as child_process.ChildProcess);

    setImmediate(() => {
      child.stdout.end();
      child.stderr.end();
      child.emit("exit", 0, null);
    });

    const exec = new CodexExec("codex");
    for await (const _ of exec.run({ input: "hi", images: ["img.png"], threadId: "thread-id" })) {
      // no-op
    }

    const commandArgs = spawnMock.mock.calls[0]?.[1] as string[] | undefined;
    expect(commandArgs).toBeDefined();
    const resumeIndex = commandArgs!.indexOf("resume");
    const imageIndex = commandArgs!.indexOf("--image");
    expect(resumeIndex).toBeGreaterThan(-1);
    expect(imageIndex).toBeGreaterThan(-1);
    expect(resumeIndex).toBeLessThan(imageIndex);
  });

  it("allows overriding the env passed to the Codex CLI", async () => {
    const { CodexExec } = await import("../src/exec");
    spawnMock.mockClear();
    const child = new FakeChildProcess();
    spawnMock.mockReturnValue(child as unknown as child_process.ChildProcess);

    setImmediate(() => {
      child.stdout.end();
      child.stderr.end();
      child.emit("exit", 0, null);
    });

    process.env.CODEX_ENV_SHOULD_NOT_LEAK = "leak";

    try {
      const exec = new CodexExec("codex", {
        CODEX_HOME: "/tmp/codex-home",
        CUSTOM_ENV: "custom",
      });

      for await (const _ of exec.run({
        input: "custom env",
        apiKey: "test",
        baseUrl: "https://example.test",
      })) {
        // no-op
      }

      const commandArgs = spawnMock.mock.calls[0]?.[1] as string[] | undefined;
      expect(commandArgs).toBeDefined();
      const spawnOptions = spawnMock.mock.calls[0]?.[2] as child_process.SpawnOptions | undefined;
      const spawnEnv = spawnOptions?.env as Record<string, string> | undefined;
      expect(spawnEnv).toBeDefined();
      if (!spawnEnv || !commandArgs) {
        throw new Error("Spawn args missing");
      }

      expect(spawnEnv.CODEX_HOME).toBe("/tmp/codex-home");
      expect(spawnEnv.CUSTOM_ENV).toBe("custom");
      expect(spawnEnv.CODEX_ENV_SHOULD_NOT_LEAK).toBeUndefined();
      expect(spawnEnv.CODEX_API_KEY).toBe("test");
      expect(spawnEnv.CODEX_INTERNAL_ORIGINATOR_OVERRIDE).toBeDefined();
      expect(commandArgs).toContain("--config");
      expect(commandArgs).toContain(`openai_base_url=${JSON.stringify("https://example.test")}`);
    } finally {
      delete process.env.CODEX_ENV_SHOULD_NOT_LEAK;
    }
  });

  it("resolves the package-layout binary and PATH directory", async () => {
    const { resolveNativePackage } = await import("../src/exec");
    const vendorRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codex-sdk-vendor-"));
    const packageRoot = path.join(vendorRoot, "x86_64-unknown-linux-musl");
    const binDir = path.join(packageRoot, "bin");
    const pathDir = path.join(packageRoot, "codex-path");
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(pathDir, { recursive: true });
    fs.writeFileSync(path.join(packageRoot, "codex-package.json"), "{}");
    fs.writeFileSync(path.join(binDir, "codex"), "");

    expect(resolveNativePackage(vendorRoot, "x86_64-unknown-linux-musl", "codex")).toEqual({
      executablePath: path.join(binDir, "codex"),
      pathDirs: [pathDir],
    });
  });

  it("falls back to the legacy binary layout", async () => {
    const { resolveNativePackage } = await import("../src/exec");
    const vendorRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codex-sdk-vendor-"));
    const packageRoot = path.join(vendorRoot, "x86_64-unknown-linux-musl");
    const binDir = path.join(packageRoot, "codex");
    const pathDir = path.join(packageRoot, "path");
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(pathDir, { recursive: true });
    fs.writeFileSync(path.join(binDir, "codex"), "");

    expect(resolveNativePackage(vendorRoot, "x86_64-unknown-linux-musl", "codex")).toEqual({
      executablePath: path.join(binDir, "codex"),
      pathDirs: [pathDir],
    });
  });

  it("prepends package PATH entries without duplicating them", async () => {
    const { prependPathDirs } = await import("../src/exec");
    const pathDir = path.join(os.tmpdir(), "codex-path");
    const env = { PATH: `/usr/bin${path.delimiter}${pathDir}` };

    prependPathDirs(env, [pathDir]);

    expect(env).toEqual({ PATH: `${pathDir}${path.delimiter}/usr/bin` });
  });

  it("preserves the Windows Path key when prepending package PATH entries", async () => {
    const { prependPathDirs } = await import("../src/exec");
    const pathDir = path.join(os.tmpdir(), "codex-path");
    const env = { PATH: "/usr/bin", Path: `C\\Windows${path.delimiter}${pathDir}` };

    prependPathDirs(env, [pathDir], "win32");

    expect(env).toEqual({ Path: `${pathDir}${path.delimiter}C\\Windows` });
  });
});
