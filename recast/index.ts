import puppeteer from "../mod.ts";
import { delay } from "https://deno.land/std@0.170.0/async/mod.ts"
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts"
import { getActiveConditions, getActiveThreads, inactivateThread, upsertMessages, upsertThread } from "./db.ts";
import { getActiveThreadsFromWeb, getMessages, getMessagesSp, isArchivedThread } from "./lib.ts";
import { Logger } from "./logger.ts";

Logger.info('start');

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
  Logger.error(error);
  Deno.exit();
}

Logger.info('database connection succeeded.');

let browser = await puppeteer.launch({
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
  ],
});

Logger.info('browser launched.');

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
          Logger.info(`new thread: ${t.title}`);
          await upsertThread(client, t);
        }
        actives = web_threads;
      }
      
      for (const thread of actives) {
        Logger.info(`start getMessages: ${thread.title}`);
        const messages = [];
        try {
          messages.push(...await getMessages(page, thread, condition));
          // messages.push(...await getMessagesSp(page, thread, condition));
        } catch (error) {
          Logger.error(error);
          await browser.close();
          await client.end();
          Logger.info('end');
          Deno.exit(1);
        }

        if (messages.length === 0) {
          Logger.error('no messages found.');
          await delay(8000);
          continue;
        }

        const nums = messages.map(m => m.num);
        const max = Math.max(...nums);
        Logger.info(`${max - thread.count} messages found.`);
        thread.count = max;
        await upsertThread(client, thread);
        await upsertMessages(client, messages);
        if (max > 1000 || await isArchivedThread(page, thread, condition)) {
          Logger.info(`inactivated: ${thread.title}`);
          await inactivateThread(client, thread);
        }
      }
    }
    await page.close({ runBeforeUnload: true });
  } catch (error) {
    Logger.error(error);
    Logger.info('timeout. relaunch browser...');
    await browser.close();
    Logger.info('browser closed.');
    browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    Logger.info('browser relaunched.');
  }
}

await browser.close();

await client.end();

Logger.info('end');