import { cmuDictionaryLookup, syllableCount } from 'syllable-count-english';

// all 15 ARPAbet vowel phonemes, each one is a syllable basically (without stress markers because those aren't useful here haha)
const vowels = new Set(['AO', 'AA', 'IY', 'UW', 'EH', 'IH', 'UH', 'AH', 'AE', 'EY', 'AY', 'OW', 'AW', 'OY', 'ER']);

const pattern = /\w+(?:[\w'\-.][\w.]+)?/g;

function analyze(arpabet: string): { count: number; collapsible: boolean } {
	const phonemes = arpabet.split(' ');
	let count = 0;
	let collapsible = false;

	for (let i = 0; i < phonemes.length; i++) {
		if (vowels.has(phonemes[i].slice(0, 2))) count++; // count syllables by counting vowel phonemes (and slice the stress marker if it exists)
		const next = phonemes[i + 1];
		// when ee is followed by another vowel can be pronounced as 1 syllable this is why we mark it as collapsible :D
		// however it can only be collapsed if the next vowel is unstressed (ARPAbet vowel ends with 0)
		if (phonemes[i] === 'IY0' && next?.endsWith('0') && vowels.has(next.slice(0, 2))) collapsible = true;
	}

	return { count, collapsible };
}

function syllables(word: string): Set<number> {
	const counts = new Set<number>();

	for (let variant = 0; ; variant++) {
		const arpabet = cmuDictionaryLookup(variant === 0 ? word : `${word}(${variant})`); // look up word pronunciation in CMU dictionary, also looks for other variants of pronunciation
		if (!arpabet) break;

		const { count, collapsible } = analyze(arpabet);
		counts.add(count);
		if (collapsible) counts.add(count - 1); // if the word is collapsible (which we marked before), we remove one syllable
	}

	// support for oov words
	if (counts.size === 0) {
		// word isn't in cmu, fall back to the library.
		const count = syllableCount(word);
		counts.add(count); // allows for the syllable count given by the library
		counts.add(count + 1); // allows for an extra syllable in case the library fucks up
		if (count > 1) counts.add(count - 1); // allows for one less syllable in case the library fucks up
	}

	return counts;
}

function syllableCounts(line: string, target: number): Set<number> {
	const words = line.match(pattern) ?? []; // match words including contractions and hyphenated words

	let totals = new Set([0]);
	// loop through each word in this line and get the total syllable count
	for (const word of words) {
		const wordCounts = syllables(word); // get syllable count for the word
		const next = new Set<number>();
		for (const total of totals) {
			for (const count of wordCounts) {
				const sum = total + count;
				if (sum <= target) next.add(sum);
			}
		}

		if (next.size === 0) return next; // no need to continue
		totals = next;
	}

	return totals;
}

export function isHaiku(content: string): boolean {
	// haiku or no haiku, that is the question
	const lines = content
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length !== 3) return false;

	const targets = [5, 7, 5] as const;
	return lines.every((line, i) => syllableCounts(line, targets[i]).has(targets[i]));
}
