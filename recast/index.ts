import puppeteer from "../mod.ts";
import { delay } from "https://deno.land/std@0.170.0/async/mod.ts"

const browser = await puppeteer.launch({
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
  ],
});
const page = await browser.newPage();
while (true) {
  await page.goto("https://eagle.5ch.net/test/read.cgi/livejupiter/1671966287/");

  const title = await page.title();
  console.log(title);
  await delay(1000);
}
await browser.close();
