import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { Agent, fetch as undiciFetch } from 'undici';

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

export async function safeFetch(raw: string): Promise<Response> {
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new SafeFetchError('Invalid URL.');
	}

	const agent = new Agent({
		connect: {
			lookup: (hostname, _opts, callback) => {
				resolveValidatedIp(hostname)
					.then(({ address, family }) => callback(null, address, family))
					.catch((error: unknown) => callback(error as Error, '', 4));
			},
		},
	});

	for (let i = 0; i <= MAX_REDIRECTS; i++) {
		validate(url);

		try {
			const res = await undiciFetch(url.toString(), {
				redirect: 'manual',
				signal: AbortSignal.timeout(TIMEOUT_MS),
				dispatcher: agent,
			});

			if (res.status >= 300 && res.status < 400) {
				const loc = res.headers.get('location');
				if (!loc) return res as unknown as Response;
				url = new URL(loc, url);
				continue;
			}

			return res as unknown as Response;
		} catch (err: unknown) {
			if (err instanceof SafeFetchError) throw err;
			throw new SafeFetchError('Request failed.');
		}
	}

	throw new SafeFetchError('Too many redirects.');
}
