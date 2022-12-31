export interface Condition {
    id: number,
    domain: string,
    board: string,
    keyword: string,
    active: boolean,
}

export interface Thread {
    id: string,
    active: boolean,
    count: number,
    url: string,
    title: string,
    condition_id: number,
}

export interface Message {
    num: number,
    thread_id: string,
    condition_id: number,
    name: string,
    date: string,
    uid: string,
    mes: string
}
