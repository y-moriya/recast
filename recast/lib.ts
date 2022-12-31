import { Page } from "../mod.ts";
import { Condition, Message, Thread } from "./type.ts";
import { getText, isActiveTargetThread } from "./util.ts";

export async function isArchivedThread(page: Page, thread: Thread, condition: Condition) : Promise<boolean> {
    const url = buildThreadUrlForNewMessage(thread, condition);

    await page.goto(url);
    const stopred = await page.$('div.stopred');

    return stopred ? true : false;
}

export async function getMessages(page: Page, thread: Thread, condition: Condition) : Promise<Message[]> {
    const url = buildThreadUrlForNewMessage(thread, condition);

    const res = await page.goto(url);
    if (res?.status() === 410) {
        throw new Error("Gone.");
    }

    const messages: Message[] = [];
    const posts = await page.$$('.post');
    for (const post of posts) {
        const numElement = await post.$('.number');
        const num = parseInt(await getText(numElement));
        const nameElement = await post.$('.name');
        const name = await getText(nameElement);
        const dateElement = await post.$('.date');
        const date = await getText(dateElement);
        const uidElement = await post.$('.uid');
        const uid = await getText(uidElement);
        const mesElement = await post.$('.message');
        const mesHandler = await mesElement?.getProperty('innerHTML');
        const mes = await mesHandler?.jsonValue();
        
        messages.push({ num: num, thread_id: thread.id, condition_id: condition.id, name: name, date: date, uid: uid, mes: mes });
    }
    return messages;
}

export async function getMessagesSp(page: Page, thread: Thread, condition: Condition) : Promise<Message[]> {
    const url = buildThreadUrlForNewMessage(thread, condition);

    const res = await page.goto(url);
    if (res?.status() === 410) {
        throw new Error("Gone.");
    }

    const messages: Message[] = [];
    const posts = await page.$$('#thread li.threadview_response:not(.res_ad)');
    for (const post of posts) {
        const infoElement = await post.$('.threadview_response_info');
        const info = await getText(infoElement);
        const regex = /(\d+)\s([^\(]+)\(([^\)]+)\)\s(.+)$/;
        const match = info.match(regex);
        if (!match) {
            console.log('not matched: ', info);
            continue;
        }
        const num = parseInt(match[1]);
        const name = match[2];
        const uid = match[3];
        const date = match[4];

        const mesElement = await post.$('.threadview_response_body');
        const mes = await getText(mesElement);

        messages.push({ num: num, thread_id: thread.id, condition_id: condition.id, name: name, date: date, uid: uid, mes: mes });
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