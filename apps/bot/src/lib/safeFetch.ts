import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { Agent, request as undiciRequest } from 'undici';

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

export class SafeFetchError extends Error {}

async function resolveValidatedIp(hostname: string): Promise<{ address: string; family: 4 | 6 }> {
	if (ipaddr.isValid(hostname)) {
		const parsed = ipaddr.parse(hostname);
		if (parsed.range() !== 'unicast') {
			throw new SafeFetchError(`Blocked address range for ${hostname}`);
		}
		return { address: hostname, family: parsed.kind() === 'ipv4' ? 4 : 6 };
	}

	const records = await lookup(hostname, { all: true });
	if (records.length === 0) throw new SafeFetchError(`No DNS records for ${hostname}`);

	for (const { address } of records) {
		if (ipaddr.parse(address).range() !== 'unicast') {
			throw new SafeFetchError(`Blocked address range for ${hostname}`);
		}
	}

	const { address, family } = records[0];
	return { address, family: family as 4 | 6 };
}

function validate(url: URL): void {
	if (url.protocol !== 'https:') throw new SafeFetchError('HTTPS required.');
	if (url.port && url.port !== '443') throw new SafeFetchError('Port 443 only.');
}

function flattenHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
	const flat: Record<string, string> = {};
	for (const [key, val] of Object.entries(headers)) {
		if (val === undefined) continue;
		flat[key] = Array.isArray(val) ? val.join(', ') : val;
	}
	return flat;
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

		const { address, family } = await resolveValidatedIp(url.hostname).catch((err) => {
			throw err instanceof SafeFetchError ? err : new SafeFetchError('DNS resolution failed.');
		});

		const connectUrl = new URL(url.toString());
		connectUrl.hostname = family === 6 ? `[${address}]` : address;

		const agent = new Agent({ connect: { servername: url.hostname } });

		const { statusCode, headers, body } = await undiciRequest(connectUrl.toString(), {
			headers: { host: url.host },
			signal: AbortSignal.timeout(TIMEOUT_MS),
			dispatcher: agent,
		}).catch((err: unknown) => {
			if (err instanceof SafeFetchError) throw err;
			throw new SafeFetchError('Request failed.');
		});

		if (statusCode >= 300 && statusCode < 400) {
			await body.dump().catch(() => undefined);
			const loc = Array.isArray(headers.location) ? headers.location[0] : headers.location;
			if (!loc) return new Response(null, { status: statusCode, headers: flattenHeaders(headers) });
			url = new URL(loc, url);
			continue;
		}

		const buffer = await body.arrayBuffer();
		return new Response(buffer, { status: statusCode, headers: flattenHeaders(headers) });
	}

	throw new SafeFetchError('Too many redirects.');
}
