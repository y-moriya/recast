import { ElementHandle } from "../mod.ts";

export async function getText(element: ElementHandle<any> | null): Promise<string> {
    if (!element) return "";
    const jsHandle = await element.getProperty('textContent');
    return await jsHandle.jsonValue();
}

export function isActiveTargetThread(title: string, keyword: string): boolean {
    if (!title.includes(keyword)) return false;
    const num = getThreadNum(title);
    if (num === 0) return false;
    if (num === 1002) return false;

    return true;
}

export function getThreadNum(title: string): number {
    const res = title.match(/\((\d+)\)$/);
    if (!res) return 0;
    return parseInt(res[1]);
}
