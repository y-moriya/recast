import puppeteer from "../mod.ts";
import { delay } from "https://deno.land/std@0.170.0/async/mod.ts"
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts"
import { getActiveConditions, getActiveThreads, inactivateThread, upsertMessages, upsertThread } from "./db.ts";
import { getActiveThreadsFromWeb, getMessages } from "./lib.ts";
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

const clog = log.getLogger();

clog.info('start');

const client = new Client({
  user: "postgres",
  password: "postgres",
  database: "postgres",
  hostname: "db",
  port: 5432,
});
try {
  await client.connect();
} catch (error) {
  clog.error(error);
  Deno.exit();
}

clog.info('database connection succeeded.');

let browser = await puppeteer.launch({
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
  ],
});

clog.info('browser launched.');

while (true) {
  const page = await browser.newPage();
  try {
    const conditions = await getActiveConditions(client);
    await delay(8000);
  
    for (const condition of conditions) {
      let actives = await getActiveThreads(client, condition.id);
      if (actives.length === 0) {
        const web_threads = await getActiveThreadsFromWeb(page, condition);
        for (const t of web_threads) {
          clog.info(`new thread: ${t.title}`);
          await upsertThread(client, t);
        }
        actives = web_threads;
      }
      
      for (const thread of actives) {
        clog.info(`start getMessages: ${thread.title}`);
        const messages = await getMessages(page, thread, condition);
        const max_count = messages[messages.length-1].num
        clog.info(`${max_count - thread.count} messages found.`);
        thread.count = max_count;
        await upsertThread(client, thread);
        await upsertMessages(client, messages);
        if (max_count > 1000) {
          clog.info(`inactivated: ${thread.title}`);
          await inactivateThread(client, thread);
        }
        // await delay(8000 / actives.length);
      }
    }
    await page.close({ runBeforeUnload: true });
  } catch (error) {
    clog.error(error);
    clog.info('timeout. relaunch browser...');
    // await page.close({ runBeforeUnload: true });
    // clog.info('page closed.');
    await browser.close();
    clog.info('browser closed.');
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    clog.info('browser relaunched.');
  }
}

await browser.close();

await client.end();

clog.info('end');