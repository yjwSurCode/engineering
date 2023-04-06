interface DateYmd {
    y: number;
    m: number;
    d: number;
}

/** 获取年月日 */
export function getDateYmd(date): DateYmd {
    return {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
    };
}

/** 格式化时间 => Date | DateYmd */
export function formatDate(value?: string | number[] | number | Date, ymd?: false): Date;
export function formatDate(value?: string | number[] | number | Date, ymd?: true): DateYmd;
export function formatDate(value?: string | number[] | number | Date, ymd?: boolean) {
    if (!value) {
        return ymd ? getDateYmd(new Date()) : new Date();
    }

    let dateArr;
    if (value instanceof Array) {
        dateArr = value;
    } else if (typeof value === 'string') {
        dateArr = value.split(/\D+/).map((s) => Number(s));
    } else if (typeof value === 'number') {
        return ymd ? getDateYmd(new Date(value)) : new Date(value);
    } else {
        return ymd ? getDateYmd(value) : value;
    }

    if (ymd) {
        return {
            y: dateArr[0],
            m: dateArr[1],
            d: dateArr[2],
        };
    }

    return new Date(...(dateArr.map((d, idx) => (idx === 1 ? d - 1 : d)) as [number, number, number]));
}

/** 获取当前月份最后一天 */
export function getMonthEndDay(year: number, month: number): number {
    return 32 - new Date(year, month - 1, 32).getDate();
}

/** 获取时间段
 *  range:  '1year' | '-10year' | 10 (可为负);
 *  format: '-' | '/' | ',' | string[] | ((v: Date) => any)
 *  例: getRangeDate(start, '1year', '-')、getRangeDate(start, 30, ['年', '月', '日']);
 */
export function getRangeDate(
    start: string | number | Date,
    range: string | number = '1year',
    format: '-' | '/' | ',' | string[] | ((v: Date) => any) = (v) => v,
) {
    const rangeExec = /(-{0,1}\d+)(year)?/.exec(`${range}`);

    if (!rangeExec) {
        throw new Error('range参数格式错误');
    }

    const [, diff, type] = rangeExec;

    const f = typeof format === 'string' ? [format, format] : format;

    const formatFn =
        f instanceof Array
            ? (v: Date) => {
                  const { y, m, d } = getDateYmd(v);

                  const mm = m < 10 ? `0${m}` : m;

                  const dd = d < 10 ? `0${d}` : d;
                  return `${y}${f[0]}${mm}${f[1]}${dd}${f[2] || ''}`;
              }
            : f;

    // 按年计算
    if (type) {
        const startYmd = formatDate(start, true);
        const startDate = formatDate(start);

        let endDate;
        const endY = startYmd.y / 1 + Number(diff);
        // 闰年判断
        if (startYmd.m === 2 && startYmd.d === 29 && !((endY % 4 === 0 && endY % 100 !== 0) || endY % 400 === 0)) {
            endDate = formatDate([endY, 2, 28]);
        } else {
            endDate = formatDate([endY, startYmd.m, startYmd.d]);
        }

        return { start: formatFn(startDate), end: formatFn(endDate) };
    }

    // 按日算
    const startDate = formatDate(start);
    const endDate = formatDate(startDate.valueOf() + Number(diff) * (1000 * 60 * 60 * 24));

    return { start: formatFn(startDate), end: formatFn(endDate) };
}
