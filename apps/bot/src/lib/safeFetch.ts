import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

export class SafeFetchError extends Error {}

async function assertSafeHost(hostname: string): Promise<void> {
	const records = ipaddr.isValid(hostname) ? [{ address: hostname }] : await lookup(hostname, { all: true });

	if (records.length === 0) {
		throw new SafeFetchError(`No DNS records for ${hostname}`);
	}

	for (const { address } of records) {
		if (ipaddr.parse(address).range() !== 'unicast') {
			throw new SafeFetchError(`Blocked address range for ${hostname}`);
		}
	}
}

function validate(url: URL) {
	if (url.protocol !== 'https:') throw new SafeFetchError('HTTPS required.');
	if (url.port && url.port !== '443') throw new SafeFetchError('Port 443 only.');
}

export async function safeFetch(raw: string, init: RequestInit = {}): Promise<Response> {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new SafeFetchError('Invalid URL.');
	}

	for (let i = 0; i <= MAX_REDIRECTS; i++) {
		validate(url);
		await assertSafeHost(url.hostname);

		const res = await fetch(url, {
			...init,
			redirect: 'manual',
			signal: AbortSignal.timeout(TIMEOUT_MS),
		}).catch(() => {
			throw new SafeFetchError('Request failed.');
		});

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
