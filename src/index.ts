// Description:
//   A hubot script that executes Vim.
//
// Configuration:
//   HUBOT_VIMEXEC_EXCLUDE_COMMANDS
//     Comma separated commands to exclude.
//     Ex, h[elp],vimhelp
//   HUBOT_VIMEXEC_ENABLE_ROOMS
//     Comma separated room names that enables this script.
//     When this is empty, enabled at all rooms.
//   HUBOT_VIMEXEC_GROUP
//     Group name.
//
// Commands:
//   :xxx
//
// Notes:
//   This script requires Vim.
//
// Author:
//   thinca <thinca+npm@gmail.com>

import * as hubot from "hubot";
import {VimExecutor} from "./vim_executor";
import {seqPattern} from "./seq_pattern";

export = function(robot: hubot.Robot): void {
  const info = (msg: string) => {
    robot.logger.info(`vimexec: ${msg}`);
  };
  const debug = (msg: string) => {
    robot.logger.debug(`vimexec: ${msg}`);
  };

  const vimExecutor = new VimExecutor({group: process.env.HUBOT_VIMEXEC_GROUP});
  vimExecutor.on("start", () => {
    console.log("Vim started");
  });
  vimExecutor.on("exit", (exitCode: number) => {
    console.log(`Vim exited: ${exitCode}`);
  });
  vimExecutor.start();

  const ignoreRegExp = ((): RegExp => {
    if (process.env.HUBOT_VIMEXEC_EXCLUDE_COMMANDS) {
      const commands = process.env.HUBOT_VIMEXEC_EXCLUDE_COMMANDS.split(/\s*,\s*/);
      const commandPatterns = commands.map((c) =>
        c.replace(/\[(\w+)\]/, (_match, p1) => seqPattern(p1))
      );
      const pat = `^:(?:${commandPatterns.join("|")})\\b`;
      return new RegExp(pat);
    } else {
      return /(?!)/;  // never match
    }
  })();
  info(`ignoreRegExp: ${JSON.stringify(ignoreRegExp.source)}`);

  const enabledRoomsRegExp = ((): RegExp => {
    if (process.env.HUBOT_VIMEXEC_ENABLE_ROOMS) {
      const roomNames = process.env.HUBOT_VIMEXEC_ENABLE_ROOMS.split(/\s*,\s*/);
      const roomPatterns = roomNames.map((roomName) => {
        if (/^\/.+\/$/.test(roomName)) {
          return roomName.slice(1, -1);
        } else {
          return `^${roomName}$`;
        }
      });
      return new RegExp(roomPatterns.join("|"));
    } else {
      return /(?:)/;  // always match
    }
  })();
  info(`enabledRoomsRegExp: ${JSON.stringify(enabledRoomsRegExp.source)}`);

  const execute = async (text: string, user: hubot.User): Promise<string> => {
    const script = text.slice(1);
    try {
      const rawResult = await vimExecutor.execute(script);
      const result = rawResult.replace(/^(?:[^\S\n]*\n)*|\n\s*$/g, "");
      info(`user: ${user.name}\nscript:\n${script}\n\nresult:\n${result}`);
      if (result.length === 0) {
        const line = script.split("\n")[0];
        return `done with no output: ${line}`;
      } else {
        return "```\n" + result + "\n```";
      }
    } catch (e) {
      const line = script.split("\n")[0];
      const message = e instanceof Error ? e.message : "Error";
      return `${message}: ${line}`;
    }
  };

  robot.respond(/:/i, async (res: hubot.Response) => {
    const {user, text} = res.message;

    if (!text) {
      return;
    }
    const script = text.replace(/^\S+\s+/, "");
    if (script[0] !== ":") {
      return;
    }
    if (ignoreRegExp.test(script)) {
      debug(`Ignore command: ${script}`);
      return;
    }

    const result = await execute(script, user);
    res.reply(result);
  });

  robot.hear(/^:/i, async (res: hubot.Response) => {
    const {room, user, text} = res.message;

    if (!text) {
      return;
    }
    if (!enabledRoomsRegExp.test(room)) {
      debug(`Ignore room: ${room}`);
      return;
    }
    if (/^:\S+:/.test(text)) {
      debug(`Ignore emoji: ${text}`);
      return;
    }
    if (ignoreRegExp.test(text)) {
      debug(`Ignore command: ${text}`);
      return;
    }

    const result = await execute(text, user);
    res.send(result);
  });
}
