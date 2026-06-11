import { syllable } from 'syllable';

export function isHaiku(content: string): boolean {
	const lines = content
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length !== 3) return false;

	return lines.map(syllable).join() === '5,7,5';
}
