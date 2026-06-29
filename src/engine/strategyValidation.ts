export type StrategySide = 'attacker' | 'defender';

export interface SanitizedStrategy {
  original: string;
  sanitized: string;
  dismissedParts: string[];
  hasRealisticContent: boolean;
}

/**
 * Risk battles are pre-WWI: infantry, cavalry, cannons, and period tactics only.
 * Unrealistic fragments are stripped — not used to block simulation.
 */
const UNREALISTIC_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bnuclear\b|\bnuke\b|\batom(?:ic)?\s+bomb\b|\bhydrogen\s+bomb\b/i, label: 'nuclear weapons' },
  { pattern: /\bmissile\b|\brockets?\b|\bicbm\b|\bballistic\b/i, label: 'modern missiles' },
  { pattern: /\bairplanes?\b|\baircraft\b|\bjets?\b|\bbombers?\b|\bhelicopters?\b|\bdrone\b|\buav\b/i, label: 'aircraft' },
  { pattern: /\btanks?\b|\barmored?\s+vehicles?\b|\bpanzer\b/i, label: 'tanks or armored vehicles' },
  { pattern: /\bsubmarines?\b|\btorpedoes?\b/i, label: 'submarines or torpedoes' },
  { pattern: /\bmachine\s+guns?\b|\bautomatic\s+(?:rifle|weapon)s?\b/i, label: 'automatic weapons' },
  { pattern: /\bsuperhuman\b|\bsuper[\s-]?human\b|\bsuperpower\b|\bsuper[\s-]?power\b/i, label: 'superhuman abilities' },
  { pattern: /\bmagic\b|\bspell\b|\bwizard\b|\bsorcery\b|\benchanted\b/i, label: 'magic or fantasy' },
  { pattern: /\bdragons?\b|\bgiants?\b|\bmonsters?\b|\baliens?\b|\bmutants?\b|\bzombies?\b/i, label: 'fantasy or sci-fi creatures' },
  { pattern: /\blasers?\b|\bplasma\b|\bforce\s+field\b|\bteleport\b|\btime\s+travel\b/i, label: 'sci-fi technology' },
  { pattern: /\bchemical\s+weapons?\b|\bpoison\s+gas\b|\bmustard\s+gas\b/i, label: 'chemical weapons' },
  { pattern: /\bworld\s+war\s+(?:ii|2|two)\b|\bww2\b|\bwwii\b/i, label: 'World War II references' },
];

const PERIOD_GUIDANCE =
  'Battles use pre-World War I tactics only: infantry, cavalry, cannons/artillery, fortifications, ambushes, sieges, and terrain advantage.';

/** Minimum word count to count as a real strategy after sanitization. */
const MIN_STRATEGY_WORDS = 3;

export function getPeriodGuidance(): string {
  return PERIOD_GUIDANCE;
}

function containsUnrealistic(text: string): boolean {
  return UNREALISTIC_PATTERNS.some(({ pattern }) => pattern.test(text));
}

function stripUnrealisticTokens(text: string): { text: string; removed: string[] } {
  let result = text;
  const removed: string[] = [];
  for (const { pattern, label } of UNREALISTIC_PATTERNS) {
    if (pattern.test(result)) {
      result = result.replace(pattern, ' ');
      removed.push(label);
    }
  }
  return { text: result.replace(/\s{2,}/g, ' ').replace(/\s+([,.!?])/g, '$1').trim(), removed };
}

function splitClauses(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+|;\s*|\s+—\s+|\s+-\s+(?=[A-Za-z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Remove unrealistic clauses/tokens and keep the rest.
 * If nothing meaningful remains, hasRealisticContent is false (score as no strategy).
 */
export function sanitizeStrategyText(text: string): SanitizedStrategy {
  const original = text.trim();
  if (!original) {
    return { original: '', sanitized: '', dismissedParts: [], hasRealisticContent: false };
  }

  const dismissedParts: string[] = [];
  const clauses = splitClauses(original);
  const keptClauses: string[] = [];

  for (const clause of clauses) {
    if (containsUnrealistic(clause)) {
      dismissedParts.push(clause);
    } else {
      keptClauses.push(clause);
    }
  }

  let sanitized = keptClauses.join(' ').trim();

  // Fallback: single clause with mixed realistic + unrealistic wording — strip tokens only.
  if (clauses.length === 1 && dismissedParts.length === 0 && containsUnrealistic(original)) {
    const { text: stripped, removed } = stripUnrealisticTokens(original);
    if (removed.length > 0) {
      dismissedParts.push(`Removed: ${removed.join(', ')}`);
      sanitized = stripped;
    }
  }

  // Clean up any stray unrealistic tokens left in kept text.
  if (sanitized && containsUnrealistic(sanitized)) {
    const { text: stripped, removed } = stripUnrealisticTokens(sanitized);
    if (removed.length > 0) {
      dismissedParts.push(`Removed: ${removed.join(', ')}`);
      sanitized = stripped;
    }
  }

  const wordCount = sanitized.split(/\s+/).filter(Boolean).length;
  const hasRealisticContent = wordCount >= MIN_STRATEGY_WORDS;

  return {
    original,
    sanitized: hasRealisticContent ? sanitized : '',
    dismissedParts,
    hasRealisticContent,
  };
}

export function sanitizeBattleStrategies(
  attackerStrategyText: string,
  defenderStrategyText: string
): { attacker: SanitizedStrategy; defender: SanitizedStrategy } {
  return {
    attacker: sanitizeStrategyText(attackerStrategyText),
    defender: sanitizeStrategyText(defenderStrategyText),
  };
}

/** Score 1 when nothing realistic remains after sanitization. */
export function realismScoreCap(sanitized: SanitizedStrategy, score: number): number {
  if (!sanitized.hasRealisticContent) return 1;
  return score;
}

export function formatDismissedNote(sanitized: SanitizedStrategy): string | null {
  if (sanitized.dismissedParts.length === 0) return null;
  return `Unrealistic elements dismissed: ${sanitized.dismissedParts.join(' | ')}`;
}
