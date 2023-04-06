import { Dictionary } from '../core/interfaces';

export type LogFunction = (message: string, meta?: Dictionary) => void;

export interface Logger {
	error: LogFunction;
	warn: LogFunction;
	info: LogFunction;
	debug: LogFunction;
	with: (ctx: Dictionary) => Logger;
}

class TaggedLogger implements Logger {
	constructor(private _tag: string, private _meta?: Dictionary) {}

	error(message: string, meta?: Dictionary) {
		this._log('error', message, meta);
	}

	warn(message: string, meta?: Dictionary) {
		this._log('warn', message, meta);
	}

	info(message: string, meta?: Dictionary) {
		this._log('info', message, meta);
	}

	debug(message: string, meta?: Dictionary) {
		this._log('debug', message, meta);
	}

	protected _log(level: string, message: string, meta?: Dictionary) {
		const args = this._meta || meta ? [{ ...this._meta, ...meta }] : [];
		(console as any)[level](`[${this._tag}] ${message}`, ...args);
	}

	with(meta: Dictionary): Logger {
		return new TaggedLogger(this._tag, { ...this._meta, ...meta });
	}
}

export function createLogger(tag: string): Logger {
	return new TaggedLogger(tag);
}

export function formatErrorMessage(error: any) {
	return error ? error.message || error : 'Error';
}
