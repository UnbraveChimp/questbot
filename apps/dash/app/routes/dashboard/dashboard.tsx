// QuestBot: A free and open-source Discord Bot.
// Copyright(C) 2026 Vantern
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Button } from '~/components/button/button';
import { Dropdown } from '~/components/dropdown/dropdown';
import { Input } from '~/components/input/input';
export function meta() {
	return [{ title: 'Dashboard | QuestBot' }, { name: 'description', content: 'QuestBot Dashboard' }];
}

export default function Auth() {
	return (
		<main className="flex min-h-screen items-center gap-4 justify-center bg-white">
			<Dropdown width="250px">
				<option value="option1">Option 1</option>
				<option value="option2">rah</option>
				<option value="option3">RAHHHH (trans)</option>
			</Dropdown>
			<Input width="250px" placeholder="wow" />
			<Button variant="1">1</Button>
			<Button variant="2">2</Button>
		</main>
	);
}
