import { Dictionary, PageQuery } from '../core/interfaces';

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

const defaultRandomCharset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * 产生指定长度的随机字符串
 *
 * @export
 * @param [length=8] 字符串长度，默认为 16
 * @param [charset] 默认为大小写字母加数字
 * @returns
 */
export function randomString(length = 16, charset?: string): string {
    let token = '';
    charset = charset || defaultRandomCharset;

    for (let i = 0; i < length; i++) {
        token += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return token;
}

/**
 * 使当前环境休眠 n 毫秒
 *
 * @export
 * @param timeoutsMs 休眠毫秒数
 * @returns
 */
export async function sleep(timeoutsMs: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeoutsMs);
    });
}

export function snakeCase(input: string): string {
    return input.replace(/['\u2019]/g, '').replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
}

export function padZero(num: number | string, targetLength = 2): string {
    let str = num + '';

    while (str.length < targetLength) {
        str = '0' + str;
    }

    return str;
}

export function stripEmptyFields<T extends Dictionary = Dictionary>(fields?: T): T {
    const result: any = {};

    for (const key of Object.keys(fields || {})) {
        let value = fields && fields[key];

        if (typeof value === 'string') {
            value = value.trim();

            if (value) {
                result[key] = value;
            }
        } else if (value != null) {
            result[key] = value;
        }
    }

    return result;
}

export function getProperty(target: any, key: string | string[]): any {
    if (key == null) {
        return;
    }

    const path = Array.isArray(key) ? key : [key];

    let index = 0;
    const length = path.length;

    while (target != null && index < length) {
        target = target[path[index++]];
    }

    return index && index == length ? target : undefined;
}

export function convertPageQuery(query: PageQuery): { pageNo: number; pageSize: number } {
    return {
        pageNo: Math.round(query.limit / query.offset) + 1,
        pageSize: query.offset,
    };
}
