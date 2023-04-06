import Taro from '@tarojs/taro';
import { Dictionary } from '../core/interfaces';
import { ArtisanError, ArtisanErrorOptions } from './error-utils';
import { appendSearchParams, SearchParams } from './history-utils';

export interface FetchOptions {
    method?: string;
    prefix?: string;
    suffix?: string;
    params?: Dictionary;
    headers?: Dictionary;
    payload?: any;
    payloadType?: 'json' | 'form' | 'multipart';
    body?: any;
    throwNonOk?: boolean;
    dataHandler?: FetchDataHandler;
    extra?: Dictionary;
}

export type FetchDataHandler = (res: FetchResult, executor: (res: FetchResult) => Promise<any>) => Promise<any>;

export interface FetchRequest extends Omit<FetchOptions, 'headers'> {
    url: string;
}

export interface FetchResult<T = any> {
    request: FetchRequest;
    response: Taro.uploadFile.SuccessCallbackResult;
    data: T;
}

export type Fetch<O extends FetchOptions = FetchOptions> = (url: string, options: O) => Promise<FetchResult>;

export type FetchUploadPayload = Pick<Taro.uploadFile.Option, 'filePath' | 'name' | 'formData'>;

export interface FetchResponseErrorOptions extends ArtisanErrorOptions {
    request: FetchRequest;
    response: Taro.uploadFile.SuccessCallbackResult;
    data: any;
}

export class FetchResponseError extends ArtisanError {
    code: string;
    request: FetchRequest;
    response: Taro.uploadFile.SuccessCallbackResult;
    data: any;

    constructor(code: string, message: string, options: FetchResponseErrorOptions) {
        super(message, options);
        this.request = options.request;
        this.response = options.response;
        this.data = options.data;
        this.code = code;
    }
}

export class FetchClient<O extends FetchOptions = FetchOptions> {
    private constructor(private _fetch: Fetch<O>) {}

    static create(): FetchClient<FetchOptions> {
        return this.build(async (url, options) => {
            if (options.payloadType !== 'multipart') {
                const request: Taro.request.Option = {
                    url,
                    method: (options.method || 'GET').toUpperCase() as any,
                    header: options.headers,
                    data: options.body,
                    ...options.extra,
                };

                const resp = await Taro.request(request);

                return {
                    request: { ...options, url, extra: request },
                    response: {
                        ...resp,
                    },
                    data: undefined,
                };
            } else {
                const body: FetchUploadPayload = options.body || {};

                const request: Taro.uploadFile.Option = {
                    url,
                    header: options.headers,
                    ...body,
                    ...options.extra,
                };

                const resp = await Taro.uploadFile({
                    url,
                    header: options.headers,
                    ...body,
                    ...options.extra,
                });

                return {
                    request: { ...options, url, extra: request },
                    response: {
                        ...resp,
                    },
                    data: undefined,
                };
            }
        });
    }

    static build<NO extends FetchOptions = FetchOptions>(fetch: Fetch<NO>): FetchClient<NO> {
        return new FetchClient(fetch);
    }

    with<NO extends FetchOptions = O>(middleware: (fetch: Fetch<O>) => Fetch<NO>): FetchClient<NO> {
        return new FetchClient(middleware(this._fetch));
    }

    withAffix(opts?: Pick<FetchOptions, 'prefix' | 'suffix'>): FetchClient<O> {
        return new FetchClient(async (url, options) => {
            const prefix = options.prefix != null ? options.prefix : opts?.prefix;
            const suffix = options.suffix != null ? options.suffix : opts?.suffix;

            if (prefix) {
                url = `${prefix}${url}`;
            }

            if (suffix) {
                const idx = url.indexOf('?');

                if (idx < 0) {
                    url = `${url}${suffix}`;
                } else {
                    url = `${url.slice(0, idx)}${suffix}${url.slice(idx)}`;
                }
            }

            return this._fetch(url, options);
        });
    }

    withParams(opts?: Pick<FetchOptions, 'params'>): FetchClient<O> {
        return new FetchClient(async (url, options) => {
            let params: object | undefined;

            if (options.params || opts?.params) {
                params = { ...opts?.params, ...options.params };
            }

            if (params) {
                url = appendSearchParams(url, params);
            }

            return this._fetch(url, {
                ...options,
                params,
            });
        });
    }

    withPayload(opts?: Pick<FetchOptions, 'payloadType'>): FetchClient<O> {
        return new FetchClient(async (url, options) => {
            const { method, payload } = options;

            if (method && ['post', 'put', 'patch', 'delete'].indexOf(method.toLowerCase()) === -1) {
                return this._fetch(url, options);
            }

            const payloadType = options.payloadType || opts?.payloadType || 'json';

            let headers: object = { ...options.headers };
            let body: any;

            if (payload) {
                if (payloadType === 'json') {
                    headers = {
                        'content-type': 'application/json;charset=UTF-8',
                        ...headers,
                    };

                    body = JSON.stringify(payload);
                } else if (payloadType === 'form') {
                    headers = {
                        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                        ...headers,
                    };

                    body = SearchParams.parse(payload).toString();
                } else {
                    body = payload;
                }
            }

            return this._fetch(url, {
                ...options,
                headers,
                body,
            });
        });
    }

    withThrowNonOk(opts?: Pick<FetchOptions, 'throwNonOk'>): FetchClient<O> {
        return new FetchClient(async (url, options) => {
            const throwNonOk = options.throwNonOk != null ? options.throwNonOk : opts?.throwNonOk;

            const res: FetchResult = await this._fetch(url, options);

            if ((res.response.statusCode < 200 || res.response.statusCode >= 300) && throwNonOk) {
                const response = res.response;

                throw new FetchResponseError('ERR_NON_OK_RESPONSE', `Response status code ${response.statusCode}`, res);
            }

            return res;
        });
    }

    withDataHandler(opts?: Pick<FetchOptions, 'dataHandler'>): FetchClient<O> {
        return new FetchClient(async (url, options) => {
            const res: FetchResult = await this._fetch(url, options);

            const dataHandler = options.dataHandler || opts?.dataHandler || ((r, e) => e(r));

            const data = await dataHandler(res, async (res: any) => {
                try {
                    return typeof res.response.data === 'string' ? JSON.parse(res.response.data) : res.response.data;
                } catch (e) {
                    throw new FetchResponseError('ERR_PARSE_RESPONSE_DATA', 'Failed to parse response type: json', {
                        ...res,
                        data: undefined,
                        cause: e,
                    });
                }
            });

            return {
                ...res,
                data,
            };
        });
    }

    withOptions(opts: O): FetchClient<O> {
        return new FetchClient(async (url, options) => {
            return this._fetch(url, {
                ...opts,
                ...options,
                headers: {
                    ...opts.headers,
                    ...options.headers,
                },
                params: {
                    ...opts.params,
                    ...options.params,
                },
                extra: {
                    ...opts.extra,
                    ...options.extra,
                },
            });
        });
    }

    async request<R = any>(url: string, options: O): Promise<FetchResult<R>> {
        return this._fetch(url, {
            method: 'get',
            ...options,
            headers: {
                accept: 'application/json, text/plain, */*',
                ...options.headers,
            },
        });
    }
}
