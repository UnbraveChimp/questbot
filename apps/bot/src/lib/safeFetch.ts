import type { LookupAddress, LookupOptions } from 'node:dns';
import { lookup } from 'node:dns/promises';
import type http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';
import ipaddr from 'ipaddr.js';

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

export class SafeFetchError extends Error {}

type LookupCallback = ((err: NodeJS.ErrnoException | null, address: string, family: number) => void) &
	((err: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void);

function safeLookup(hostname: string, options: LookupOptions, callback: LookupCallback): void {
	lookup(hostname, { all: true })
		.then((records) => {
			if (records.length === 0) {
				callback(new SafeFetchError(`No DNS records for ${hostname}`) as NodeJS.ErrnoException, '', 4);
				return;
			}
			for (const { address } of records) {
				if (ipaddr.parse(address).range() !== 'unicast') {
					callback(new SafeFetchError(`Blocked address range for ${hostname}`) as NodeJS.ErrnoException, '', 4);
					return;
				}
			}
			if (options.all) {
				(callback as (err: null, addresses: LookupAddress[]) => void)(null, records);
			} else {
				const { address, family } = records[0];
				callback(null, address, family);
			}
		})
		.catch((error: unknown) => callback(error as NodeJS.ErrnoException, '', 4));
}

function toResponse(msg: http.IncomingMessage): Response {
	const headers: Record<string, string> = {};
	for (const [key, value] of Object.entries(msg.headers)) {
		if (value !== undefined) {
			headers[key] = Array.isArray(value) ? value.join(', ') : value;
		}
	}
	return new Response(Readable.toWeb(msg) as ReadableStream, {
		status: msg.statusCode ?? 200,
		headers,
	});
}

function request(url: URL): Promise<http.IncomingMessage> {
	return new Promise((resolve, reject) => {
		const req = https.request(
			{
				hostname: url.hostname,
				port: url.port || 443,
				path: url.pathname + url.search,
				method: 'GET',
				lookup: safeLookup,
				timeout: TIMEOUT_MS,
			},
			resolve,
		);
		req.on('timeout', () => req.destroy(new SafeFetchError('Request timed out.')));
		req.on('error', (error) => reject(error instanceof SafeFetchError ? error : new SafeFetchError('Request failed.')));
		req.end();
	});
}

function validate(url: URL): void {
	if (url.protocol !== 'https:') throw new SafeFetchError('HTTPS required.');
	if (url.port && url.port !== '443') throw new SafeFetchError('Port 443 only.');
}

export async function readLimited(response: Response, maxBytes: number): Promise<Buffer> {
	const reader = response.body?.getReader();
	if (!reader) return Buffer.alloc(0);

	const chunks: Uint8Array[] = [];
	let total = 0;

	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;

		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			throw new SafeFetchError('Response exceeds the max size.');
		}

		chunks.push(value);
	}

	return Buffer.concat(chunks);
}

export async function safeFetch(raw: string): Promise<Response> {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new SafeFetchError('Invalid URL.');
	}

	for (let i = 0; i <= MAX_REDIRECTS; i++) {
		validate(url);

		const msg = await request(url);

		if (msg.statusCode !== undefined && msg.statusCode >= 300 && msg.statusCode < 400) {
			const loc = msg.headers.location;
			if (!loc) return toResponse(msg);
			msg.resume();
			url = new URL(loc, url);
			continue;
		}

		return toResponse(msg);
	}

	throw new SafeFetchError('Too many redirects.');
}
