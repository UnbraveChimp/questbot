function syllablesWord(word: string): number {
	const cleaned = word.toLowerCase().replace(/[^a-z']/g, ''); // remove non-alphabetic chars
	if (!cleaned) return 0;
	if (cleaned.length <= 3) return 1;

	const matches = cleaned
		.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '') // remove silent ending
		.replace(/^y/, '') // remove starting y yes yes
		.match(/[aeiouy]{1,2}/g);

	return matches ? matches.length : 1;
}

function syllablesLine(line: string): number {
	return line
		.split(/\s+/)
		.filter(Boolean)
		.reduce((total, word) => total + syllablesWord(word), 0);
}

export function isHaiku(content: string): boolean {
	const lines = content
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length !== 3) return false;

	return lines.map(syllablesLine).join() === '5,7,5'; // haiku pattern
}
