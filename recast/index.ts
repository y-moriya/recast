import puppeteer from "../mod.ts";
import { delay } from "https://deno.land/std@0.170.0/async/mod.ts"
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts"

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
  console.log(error);
  Deno.exit();
}

const array_result = await client.queryArray("SELECT 1");
console.log(array_result.rows);

await client.end();

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
