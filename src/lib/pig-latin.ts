const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function isVowel(ch: string): boolean {
  return VOWELS.has(ch.toLowerCase());
}

function isLetter(ch: string): boolean {
  return /[a-zA-Z]/.test(ch);
}

function isUpperCase(ch: string): boolean {
  return ch === ch.toUpperCase() && ch !== ch.toLowerCase();
}

function applyCase(source: string, target: string): string {
  // All caps
  if (source.length > 1 && source === source.toUpperCase() && source !== source.toLowerCase()) {
    return target.toUpperCase();
  }
  // Title case (first letter upper)
  if (source.length > 0 && isUpperCase(source[0])) {
    return target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
  }
  return target.toLowerCase();
}

function translateWord(word: string): string {
  // Extract leading/trailing non-letter chars
  let leading = "";
  let trailing = "";
  let core = word;

  let i = 0;
  while (i < core.length && !isLetter(core[i])) {
    leading += core[i];
    i++;
  }
  core = core.slice(i);

  let j = core.length - 1;
  while (j >= 0 && !isLetter(core[j])) {
    j--;
  }
  trailing = core.slice(j + 1);
  core = core.slice(0, j + 1);

  if (core.length === 0) return word;

  const lowerCore = core.toLowerCase();

  // Vowel start → add "way"
  if (isVowel(lowerCore[0])) {
    return leading + applyCase(core, lowerCore + "way") + trailing;
  }

  // Find consonant cluster (including "qu" as unit)
  let clusterEnd = 0;
  while (clusterEnd < lowerCore.length && !isVowel(lowerCore[clusterEnd])) {
    clusterEnd++;
    // Treat "qu" as a unit: if we just consumed 'q' and next is 'u', take 'u' too
    if (
      lowerCore[clusterEnd - 1] === "q" &&
      clusterEnd < lowerCore.length &&
      lowerCore[clusterEnd] === "u"
    ) {
      clusterEnd++;
    }
  }

  // If entire word is consonants, just add "ay"
  if (clusterEnd >= lowerCore.length) {
    return leading + applyCase(core, lowerCore + "ay") + trailing;
  }

  const cluster = lowerCore.slice(0, clusterEnd);
  const rest = lowerCore.slice(clusterEnd);
  const translated = rest + cluster + "ay";

  return leading + applyCase(core, translated) + trailing;
}

export function toPigLatin(text: string): string {
  // Split on word boundaries, preserving whitespace and punctuation
  return text.replace(/\S+/g, (match) => translateWord(match));
}

export function getConsonantCluster(word: string): { cluster: string; rest: string } | null {
  const lower = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!lower || isVowel(lower[0])) return null;

  let clusterEnd = 0;
  while (clusterEnd < lower.length && !isVowel(lower[clusterEnd])) {
    clusterEnd++;
    if (lower[clusterEnd - 1] === "q" && clusterEnd < lower.length && lower[clusterEnd] === "u") {
      clusterEnd++;
    }
  }

  return { cluster: lower.slice(0, clusterEnd), rest: lower.slice(clusterEnd) };
}
