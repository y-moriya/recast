import { Client } from "https://deno.land/x/postgres@v0.17.0/client.ts";
import { Condition, Message, Thread } from "./type.ts";

export async function upsertThread(client: Client, thread: Thread) {
    const result = await client.queryArray(
        `insert into threads (id, active, count, url, title, condition_id) values ($1, $2, $3, $4, $5, $6)
                on conflict (id)
                do update set count = $3`,
                [thread.id, thread.active, thread.count, thread.url, thread.title, thread.condition_id]
    );
}

export async function getActiveThreads(client: Client, condition_id: number) : Promise<Thread[]> {
    const result = await client.queryObject<Thread>(
        `select * from threads where active = true and condition_id = $1`,
        [condition_id]
    );
    return result.rows;
}

export async function upsertMessages(client: Client, messages: Message[]) {
    for (const mes of messages) {
        const result = await client.queryArray(
            `insert into messages (num, thread_id, name, date, uid, mes) values ($1, $2, $3, $4, $5, $6)
            on conflict (num, thread_id) do nothing
            `,
            [mes.num, mes.thread_id, mes.name, mes.date, mes.uid, mes.mes]
        );
    }
}

export async function inactivateThread(client: Client, thread: Thread) {
    const result = await client.queryArray(
        `update threads set active = false where id = $1`,
        [thread.id]
    );
}

export async function getActiveConditions(client: Client) : Promise<Condition[]> {
    const result = await client.queryObject<Condition>(
        `select * from conditions where active = true`
    );
    return result.rows;
}