import {EventEmitter} from "events";
import * as fs from "fs";
import * as path from "path";
import * as pty from "node-pty";
import * as mkfifo from "mkfifo";

const BASE_DIR = path.dirname(__dirname);

function copyEnv(): {[key: string]: string} {
  const env: {[key: string]: string} = {};
  for (const name of Object.getOwnPropertyNames(process.env)) {
    const value = process.env[name];
    if (value) {
      env[name] = value;
    }
  }
  return env;
}

function stat(path: fs.PathLike): fs.Stats | undefined {
  try {
    return fs.statSync(path);
  } catch (e) {
    return undefined;
  }
}

export interface VimExecutorOptions {
  group?: string;
  timeoutMs?: number;
}

export class VimExecutor {
  ptyProcess: pty.IPty | null = null;
  private scriptNumber = 1;
  readonly group: string;
  readonly timeoutMs: number;
  readonly eventEmitter: EventEmitter;

  private readonly requestFilepath: string;

  constructor(readonly options?: VimExecutorOptions) {
    this.eventEmitter = new EventEmitter();
    options = options || {};
    this.group = options.group || Math.random().toString(36).slice(-6);
    this.requestFilepath = path.join(BASE_DIR, "vim-scripts", `request-${this.group}`);
    this.timeoutMs = options.timeoutMs || 10000;
  }

  start(): void {
    if (this.ptyProcess) {
      throw new Error("Alreadly running.");
    }

    const requestFileStat = stat(this.requestFilepath);
    if (requestFileStat) {
      if (!requestFileStat.isFIFO()) {
        throw new Error("Request path is already used.");
      }
    } else {
      mkfifo.mkfifoSync(this.requestFilepath, 0o600);
    }

    const script = path.join(BASE_DIR, "bin", "vim.sh");
    const env = copyEnv();
    env.VIMEXEC_GROUP = this.group;
    this.ptyProcess = pty.spawn(script, [], {
      name: "xterm-256color",
      cols: 80,
      rows: 26,
      env: env,
    });
    this.eventEmitter.emit("start");
    this.ptyProcess.onExit(({exitCode}) => {
      this.ptyProcess = null;
      this.eventEmitter.emit("exit", exitCode);
      process.nextTick(() => {
        this.start();
      });
    });
  }

  stop(): void {
    if (this.ptyProcess) {
      this.ptyProcess.kill();
      this.ptyProcess = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.on(event, callback);
  }

  isRunning(): boolean {
    return this.ptyProcess != null;
  }

  async execute(script: string): Promise<string> {
    const id = (this.scriptNumber++).toString().padStart(12, "0");
    const resultFilename = `result-${this.group}-${Date.now()}-${id}`;
    const resultFilepath = path.join(BASE_DIR, "vim-scripts", resultFilename);

    mkfifo.mkfifoSync(resultFilepath, 0o600);

    let finished = false;
    const cleanup = (): void => {
      if (fs.existsSync(resultFilepath)) {
        fs.unlinkSync(resultFilepath);
      }
    };
    const cancelPromise = new Promise<string>((_resolve, reject) => {
      const exitCallback = (exitCode: number): void => {
        finished = true;
        reject(new Error(`Vim exited: ${exitCode}`));
      };
      this.eventEmitter.on("exit", exitCallback);
      setTimeout(() => {
        this.eventEmitter.off("exit", exitCallback);
        cleanup();
        if (!finished) {
          if (this.ptyProcess) {
            this.ptyProcess.write("\x03");
          }
        }
        reject(new Error("Execution timeout"));
      }, this.timeoutMs);
    });
    const executePromise = fs.promises.readFile(resultFilepath, {encoding: "utf-8"}).then((result) => {
      finished = true;
      cleanup();
      return result;
    });
    fs.writeFileSync(this.requestFilepath, resultFilename + "\n" + script);
    return Promise.race([executePromise, cancelPromise]);
  }
}
