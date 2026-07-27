import { Prisma } from '@questbot/database';
import type { Client } from 'discord.js';

const INTERVAL = 30_000; // this can be overridden by passing intervalMs into the function

export interface ShardInfo {
	shardId: number;
	totalShards: number;
}

export function getShardInfo(client: Client): ShardInfo {
	return {
		shardId: client.shard?.ids[0] ?? 0,
		totalShards: client.shard?.count ?? 1,
	};
}

// for the bot wide cleanup that only needs to happen once
export function isPrimaryShard(client: Client): boolean {
	return getShardInfo(client).shardId === 0;
}

export function shardOwns(snowflake: Prisma.Sql, { shardId, totalShards }: ShardInfo): Prisma.Sql {
	return Prisma.sql`(${snowflake} >> 22) % ${totalShards}::bigint = ${shardId}::bigint`;
}

interface ShardedPollerOptions<T> {
	client: Client;
	getDue: (shard: ShardInfo) => Promise<T[]>;
	handle: (item: T) => Promise<void>;
	intervalMs?: number;
}

// used across multiple schedulers to handle sharded polling
export function startShardedPoller<T>({
	client,
	getDue,
	handle,
	intervalMs = INTERVAL,
}: ShardedPollerOptions<T>): void {
	const tick = async () => {
		try {
			const due = await getDue(getShardInfo(client));

			await Promise.allSettled(due.map((item) => handle(item).catch((err) => console.error(err))));
		} catch (err) {
			console.error(err);
		}
	};

	tick();
	setInterval(tick, intervalMs);
}
