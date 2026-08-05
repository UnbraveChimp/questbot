// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Listener, type MessageCommandDeniedPayload, type UserError } from '@sapphire/framework';

export class MessageCommandDeniedListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, { ...options, event: 'messageCommandDenied' });
	}

	public override async run(error: UserError, { message }: MessageCommandDeniedPayload) {
		await message.reply({ content: error.message });
	}
}
