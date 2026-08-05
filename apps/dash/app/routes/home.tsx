// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Route } from './+types/home';
import Auth from './auth/auth';

export function meta(_args: Route.MetaArgs) {
	return [{ title: 'Quest Dashboard' }, { name: 'description', content: 'The official Dashboard for Quest Bot!' }];
}

export default function Home() {
	return <Auth />;
}
