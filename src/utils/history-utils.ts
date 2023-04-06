import { Dictionary } from '../core/interfaces';

// https://github.com/umijs/umi-request/blob/master/src/middleware/simpleGet.js
// https://github.com/jerrybendy/url-search-params-polyfill/blob/master/index.js

const hasOwnProperty = Object.prototype.hasOwnProperty;

const ENCODING: Dictionary<string> = {
	'!': '%21',
	"'": '%27',
	'(': '%28',
	')': '%29',
	'~': '%7E',
	'%20': '+',
	'%00': '\x00',
};

function encode(str: string) {
	return encodeURIComponent(str).replace(/[!'\(\)~]|%20|%00/g, (match) => ENCODING[match]);
}

function decode(str: string) {
	return str.replace(/[ +]/g, '%20').replace(/(%[a-f0-9]{2})+/gi, (match) => decodeURIComponent(match));
}

function appendTo(
	query: Dictionary<string[] | undefined>,
	key: string,
	value: string,
): Dictionary<string[] | undefined> {
	if (query[key]) {
		query[key]?.push(value);
	} else {
		query[key] = [value];
	}

	return query;
}

function appendQueryTo(query: Dictionary<string[] | undefined>, search: Dictionary): Dictionary<string[] | undefined> {
	for (const key in search) {
		if (hasOwnProperty.call(search, key)) {
			const v = search[key];

			for (const value of Array.isArray(v) ? v : [v]) {
				appendTo(query, key, value);
			}
		}
	}

	return query;
}

export class SearchParams {
	private constructor(readonly query: Dictionary<string[] | undefined>) {}

	static parse(search?: string | undefined | null | Dictionary) {
		const query: Dictionary<string[] | undefined> = {};

		if (search != null) {
			if (typeof search === 'object') {
				appendQueryTo(query, search);
			} else if (typeof search === 'string') {
				// remove first '?'
				if (search.indexOf('?') === 0) {
					search = search.slice(1);
				}

				for (const value of search.split('&')) {
					const index = value.indexOf('=');

					if (index > -1) {
						appendTo(query, decode(value.slice(0, index)), decode(value.slice(index + 1)));
					} else {
						if (value) {
							appendTo(query, decode(value), '');
						}
					}
				}
			}
		}

		return new SearchParams(query);
	}

	append(name: string, value: string): SearchParams {
		return new SearchParams(appendTo({ ...this.query }, name, value));
	}

	appendAll(search: Dictionary): SearchParams {
		return new SearchParams(appendQueryTo({ ...this.query }, search));
	}

	set(name: string, value: string) {
		return new SearchParams({ ...this.query, [name]: [value] });
	}

	setAll(search: Dictionary) {
		const query = { ...this.query };
		const target = appendQueryTo({}, search);

		for (const key in target) {
			if (hasOwnProperty.call(target, key)) {
				query[key] = target[key];
			}
		}

		return new SearchParams(query);
	}

	delete(...name: string[]): SearchParams {
		const query = { ...this.query };

		for (const key of name) {
			delete query[key];
		}

		return new SearchParams(query);
	}

	entries(): Array<[string, string]> {
		const output: Array<[string, string]> = [];

		this.forEach((value, key) => {
			output.push([key, value]);
		});

		return output;
	}

	keys(): Array<string> {
		const output: Array<string> = [];

		this.forEach((_, key) => {
			output.push(key);
		});

		return output;
	}

	values(): Array<string> {
		const output: Array<string> = [];

		this.forEach((value) => {
			output.push(value);
		});

		return output;
	}

	forEach<TThis = this>(
		callback: (this: TThis, value: string, name: string, searchParams: SearchParams) => void,
		thisArg?: TThis,
	): void {
		const query = this.query;

		Object.getOwnPropertyNames(query).forEach((name) => {
			query[name]?.forEach((value) => {
				callback.call(thisArg as any, value, name, this);
			});
		});
	}

	get(name: string): string | undefined {
		return this.has(name) ? (this.query[name] as any)[0] : undefined;
	}

	getAll(name: string): string[] {
		return this.has(name) ? [...(this.query[name] || [])] : [];
	}

	has(name: string): boolean {
		return hasOwnProperty.call(this.query, name);
	}

	toString(): string {
		const query: string[] = [];

		for (const key in this.query) {
			if (!hasOwnProperty.call(this.query, key)) {
				continue;
			}

			const value = this.query[key];
			if (value == null) {
				continue;
			}

			const name = encode(key);

			for (const val of Array.isArray(value) ? value : [value]) {
				query.push(name + '=' + encode(typeof val === 'string' ? val : val + ''));
			}
		}

		return query.join('&');
	}
}

export function appendSearchParams(url: string, searchParams: string | undefined | null | Dictionary): string {
	const search = SearchParams.parse(searchParams).toString();

	if (search) {
		const urlSign = url.indexOf('?') < 0 ? '?' : '&';
		return `${url}${urlSign}${search}`;
	}

	return url;
}
