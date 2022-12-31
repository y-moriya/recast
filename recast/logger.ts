import * as log from "https://deno.land/std/log/mod.ts";
import { LogRecord } from "https://deno.land/std/log/mod.ts";

await log.setup({
  //define handlers
  handlers: {
      console: new log.handlers.ConsoleHandler("DEBUG", {
          formatter: (logRecord: LogRecord) => {
            const { datetime, levelName, msg } = logRecord;

            const d = new Date(datetime.getTime() + 540 * 6e4);
            const logTime = d.toISOString();
            return `${logTime} ${levelName} ${msg}`;
          },
          
      })
  },

  //assign handlers to loggers  
  loggers: {
      default: {
          level: "DEBUG",
          handlers: ["console"],
      }
  },
});

const Logger = log.getLogger();

export { Logger };