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
  robot.logger.info(`ignoreRegExp: ${JSON.stringify(ignoreRegExp.source)}`);

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
  robot.logger.info(`enabledRoomsRegExp: ${JSON.stringify(enabledRoomsRegExp.source)}`);

  robot.hear(/^:/i, async (res: hubot.Response) => {
    const {room, user, text} = res.message;

    if (!text) {
      return;
    }
    if (!enabledRoomsRegExp.test(room)) {
      robot.logger.debug(`Ignore room: ${room}`);
      return;
    }
    if (/^:\S+:/.test(text)) {
      robot.logger.debug(`Ignore emoji: ${text}`);
      return;
    }
    if (ignoreRegExp.test(text)) {
      robot.logger.debug(`Ignore command: ${text}`);
      return;
    }

    const script = text.slice(1);
    try {
      const rawResult = await vimExecutor.execute(script);
      const result = rawResult.replace(/^(?:[^\S\n]*\n)*|\n\s*$/g, "");
      robot.logger.info(`user: ${user.name}\nscript:\n${script}\n\nresult:\n${result}`);
      if (result.length === 0) {
        const line = script.split("\n")[0];
        res.send(`done with no output: ${line}`);
      } else {
        res.send("```\n" + result + "\n```");
      }
    } catch (e) {
      const line = script.split("\n")[0];
      res.send(`${e.message}: ${line}`);
    }
  });
}
