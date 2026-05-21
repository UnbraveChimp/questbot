import { lookup } from 'node:dns/promises';
import { Agent, fetch as undiciFetch, type RequestInit, type Response } from 'undici';
import ipaddr from 'ipaddr.js';

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

export class SafeFetchError extends Error {}

async function resolveSafe(hostname: string): Promise<{ address: string; family: 4 | 6 }> {
	const records = ipaddr.isValid(hostname)
		? [{ address: hostname, family: (ipaddr.parse(hostname).kind() === 'ipv4' ? 4 : 6) as 4 | 6 }]
		: (await lookup(hostname, { all: true })).map(r => ({ address: r.address, family: r.family as 4 | 6 }));

	for (const { address } of records) {
		if (ipaddr.parse(address).range() !== 'unicast') {
			throw new SafeFetchError(`Blocked address range for ${hostname}`);
		}
	}
	return records[0];
}

function validate(url: URL) {
	if (url.protocol !== 'https:') throw new SafeFetchError('HTTPS required.');
	if (url.port && url.port !== '443') throw new SafeFetchError('Port 443 only.');
}

export async function safeFetch(raw: string, init: RequestInit = {}): Promise<Response> {
	let url: URL;
	try { url = new URL(raw); } catch { throw new SafeFetchError('Invalid URL.'); }

	for (let i = 0; i <= MAX_REDIRECTS; i++) {
		validate(url);
		const { address, family } = await resolveSafe(url.hostname);

		const dispatcher = new Agent({
			connect: { lookup: (_h, _o, cb) => cb(null, address, family) },
			headersTimeout: TIMEOUT_MS,
			bodyTimeout: TIMEOUT_MS
		});

		const res = await undiciFetch(url, {
			...init,
			redirect: 'manual',
			signal: AbortSignal.timeout(TIMEOUT_MS),
			dispatcher
		}).catch(() => { throw new SafeFetchError('Request failed.'); });

		if (res.status >= 300 && res.status < 400) {
			const loc = res.headers.get('location');
			if (!loc) return res;
			url = new URL(loc, url);
			continue;
		}
		return res;
	}
	throw new SafeFetchError('Too many redirects.');
}