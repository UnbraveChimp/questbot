import type { Client } from 'discord.js';

export function ownerShardId(snowflake: string, totalShards: number): number {
	return Number((BigInt(snowflake) >> 22n) % BigInt(totalShards));
}

const INTERVAL = 30_000; // this can be overridden by passing intervalMs into the function

interface ShardedPollerOptions<T> {
	client: Client;
	getDue: () => Promise<T[]>;
	getOwnerKey: (item: T) => string;
	handle: (item: T) => Promise<void>;
	intervalMs?: number;
}

// used across multiple schedulers to handle sharded polling
export function startShardedPoller<T>({
	client,
	getDue,
	getOwnerKey,
	handle,
	intervalMs = INTERVAL,
}: ShardedPollerOptions<T>): void {
	const tick = async () => {
		try {
			const due = await getDue();
			const totalShards = client.shard?.count ?? 1;
			const shardId = client.shard?.ids[0] ?? 0;

			const owned = due.filter((item) => ownerShardId(getOwnerKey(item), totalShards) === shardId);

			await Promise.allSettled(owned.map((item) => handle(item).catch((err) => console.error(err))));
		} catch (err) {
			console.error(err);
		}
	};

	tick();
	setInterval(tick, intervalMs);
}
