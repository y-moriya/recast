import { Page } from "../mod.ts";
import { Condition, Message, Thread } from "./type.ts";
import { getText, isActiveTargetThread } from "./util.ts";

export async function getMessages(page: Page, thread: Thread, condition: Condition) : Promise<Message[]> {
    const url = buildThreadUrlForNewMessage(thread, condition);

    await page.goto(url);
    const messages: Message[] = [];
    const posts = await page.$$('.post');
    for (const post of posts) {
        const numElement = await post.$('.number');
        const num = await getText(numElement);
        const nameElement = await post.$('.name');
        const name = await getText(nameElement);
        const dateElement = await post.$('.date');
        const date = await getText(dateElement);
        const uidElement = await post.$('.uid');
        const uid = await getText(uidElement);
        const mesElement = await post.$('.message');
        const mesHandler = await mesElement?.getProperty('innerHTML');
        const mes = await mesHandler?.jsonValue();
        messages.push({ num: parseInt(num), thread_id: thread.id, name: name, date: date, uid: uid, mes: mes });
    }
    return messages;
}

export async function getActiveThreadsFromWeb(page: Page, condition: Condition) : Promise<Thread[]> {
    const url = buildThreadsListUrl(condition);
    await page.goto(url);
    const threads = await page.$$('#trad a');
    const result = [];
    for (const thread of threads) {
        const title = await getText(thread);
        if (!isActiveTargetThread(title, condition.keyword)) continue;
        const actual_title = title.replace(/^\d+:\s*/, '')
                                          .replace(/\(\d+\)$/, '');
        
        const jsHandle = await thread.getProperty('href');
        const target_url = await jsHandle.jsonValue() as string;
        const match = target_url.match(/\/(\d+)\/l50$/);
        if (!match) continue;
        const id = match[1];
        
        result.push({ id: id, active: true, count: 0, url: target_url, title: actual_title, condition_id: condition.id });
    }
    return result;
}

export function buildThreadsListUrl(condition: Condition) : string {
    return `https://${condition.domain}.5ch.net/${condition.board}/subback.html`;
}

export function buildThreadUrlForNewMessage(thread: Thread, condition: Condition) : string {
    return `https://${condition.domain}.5ch.net/test/read.cgi/${condition.board}/${thread.id}/${thread.count}-`;
}