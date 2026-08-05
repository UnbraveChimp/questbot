// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
	route('dashboard', 'routes/dashboard/dashboard.tsx'),
	route('api/auth/*', 'routes/auth/api.auth.$.ts'),
] satisfies RouteConfig;
