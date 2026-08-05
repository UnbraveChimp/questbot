// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

export const LIMITS_ENABLED = process.env.LIMITS === 'true';

export class LimitError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = 'LimitError';
	}
}
