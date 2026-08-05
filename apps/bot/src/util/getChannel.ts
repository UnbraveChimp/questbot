// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Collection } from 'discord.js';

interface ChannelManagerLike<T> {
	cache: Collection<string, T>;
	fetch(id: string): Promise<T | null>;
}

export async function getChannel<T>(manager: ChannelManagerLike<T>, channelId: string): Promise<T | null> {
	return manager.cache.get(channelId) ?? (await manager.fetch(channelId).catch(() => null));
}
