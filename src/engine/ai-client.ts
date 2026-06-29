import { GoogleGenAI, Type } from '@google/genai';
import type { BattleSetup, BattleResult, BattlePhase } from '@/types';
import { GAME_CONFIG } from '@/lib/config/gameParams';
import { getGeographyContext } from '@/lib/map/territories';
import { allStrategies } from '@/strategies';
import {
  battleSetupSeedInt32,
  formatResolvedOutcome,
  getTerrainModifiers,
  hashBattleSetup,
  resolveBattle,
  type ResolvedBattleMetrics,
} from '@/engine/battleResolver';
import {
  validateAndMergeOutcome,
  type FinalBattleOutcome,
} from '@/engine/outcomeValidation';
import {
  getPeriodGuidance,
  realismScoreCap,
  sanitizeBattleStrategies,
  formatDismissedNote,
  type SanitizedStrategy,
} from '@/engine/strategyValidation';

const RESOLUTION_SYSTEM_PROMPT = `You are a military analyst simulating a Risk-style pre-WWI battle.

HISTORICAL PERIOD:
${getPeriodGuidance()}
Unrealistic elements are already removed server-side. Score and simulate using only the remaining strategy text.

YOUR TASK (in order):
1. Score each strategy 1–10 (terrain, troop efficiency, coherence, matchup awareness).
2. Determine winner and casualties using troops, terrain, strategy scores, and defender home advantage.
3. Write brief plan-quality assessments (do NOT contradict your chosen outcome).

SCORING RULES:
- Identical strategy text MUST receive the same score every time.
- Vague plans score 3–4. Detailed terrain-aware plans score 7–9.
- No valid strategy remaining after sanitization → score 1.

OUTCOME RULES:
- Weigh troop counts AND strategy scores — a brilliant plan can upset slightly better numbers in a close fight.
- A large troop advantage should usually win unless the strategy gap is huge.
- Attacker must keep at least 1 troop if they conquer the territory.
- Defender keeps at least 1 troop if they hold.
- Winners typically lose fewer troops than losers, but hard-fought wins can be costly.
- Casualties must be integers from 0 to each side's starting troop count.

The server sanity-checks your outcome against a baseline formula and may adjust impossible results.

OUTPUT RULES:
- Each assessment max 3 sentences
- Do NOT use double-quote characters inside string values — use single quotes instead
- Do NOT use newline characters inside string values`;

const NARRATIVE_SYSTEM_PROMPT = `You are a military historian writing a Risk-style battle report.

The battle outcome is FINAL. You MUST describe exactly the winner, casualties, and territory result provided.

OUTPUT RULES:
- Exactly 3 battle phases progressing toward the stated winner
- Phase momentumShift should favor the eventual winner in phase 3
- narrativeSummary max 4 sentences — state who won and the casualty picture
- keyMoment: 1 sentence describing the decisive turn for the STATED winner
- Do NOT use double-quote characters inside string values — use single quotes instead
- Do NOT use newline characters inside string values`;

interface RawResolutionResponse {
  attackerStrategyScore: number;
  defenderStrategyScore: number;
  winner: 'attacker' | 'defender';
  attackerCasualties: number;
  defenderCasualties: number;
  attackerStrategyAssessment: string;
  defenderStrategyAssessment: string;
}

interface RawNarrativeResponse {
  battlePhases: BattlePhase[];
  narrativeSummary: string;
  keyMoment: string;
}

const RESOLUTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    attackerStrategyScore: { type: Type.NUMBER },
    defenderStrategyScore: { type: Type.NUMBER },
    winner: { type: Type.STRING, enum: ['attacker', 'defender'] },
    attackerCasualties: { type: Type.NUMBER },
    defenderCasualties: { type: Type.NUMBER },
    attackerStrategyAssessment: { type: Type.STRING },
    defenderStrategyAssessment: { type: Type.STRING },
  },
  required: [
    'attackerStrategyScore',
    'defenderStrategyScore',
    'winner',
    'attackerCasualties',
    'defenderCasualties',
    'attackerStrategyAssessment',
    'defenderStrategyAssessment',
  ],
};

const NARRATIVE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    battlePhases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.NUMBER },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          momentumShift: { type: Type.STRING, enum: ['attacker', 'defender', 'none'] },
          animationCue: { type: Type.STRING },
        },
        required: ['phase', 'title', 'description', 'momentumShift', 'animationCue'],
      },
    },
    narrativeSummary: { type: Type.STRING },
    keyMoment: { type: Type.STRING },
  },
  required: ['battlePhases', 'narrativeSummary', 'keyMoment'],
};

function buildStrategyKnowledgeBase(): string {
  return allStrategies
    .map((s) => `- ${s.name}: ${s.tacticalDescription.trim().slice(0, 80)}`)
    .join('\n');
}

function buildResolutionPrompt(
  battleSetup: BattleSetup,
  attacker: SanitizedStrategy,
  defender: SanitizedStrategy
): string {
  const geography = getGeographyContext(
    battleSetup.attackingTerritory.id,
    battleSetup.defendingTerritory.id
  );
  const terrainMods = getTerrainModifiers(battleSetup);

  const effectiveSetup: BattleSetup = {
    ...battleSetup,
    attackerStrategyText: attacker.hasRealisticContent
      ? attacker.sanitized
      : '(no valid strategy after removing unrealistic elements)',
    defenderStrategyText: defender.hasRealisticContent
      ? defender.sanitized
      : '(no valid strategy after removing unrealistic elements)',
  };

  const seed = hashBattleSetup(effectiveSetup);
  const attackerLabel = battleSetup.attackerName ?? 'Attacker';
  const defenderLabel = battleSetup.defenderName ?? 'Defender';

  return `Battle seed: ${seed}

${attackerLabel} (${battleSetup.attackingTroops} troops) attacking from ${battleSetup.attackingTerritory.name}:
Strategy: ${effectiveSetup.attackerStrategyText}
${formatDismissedNote(attacker) ?? ''}

${defenderLabel} (${battleSetup.defendingTroops} troops) defending ${battleSetup.defendingTerritory.name}:
Strategy: ${effectiveSetup.defenderStrategyText}
${formatDismissedNote(defender) ?? ''}

GEOGRAPHY: ${geography}
TERRAIN MODIFIERS: ${terrainMods}
Troop ratio: ${battleSetup.attackingTroops} vs ${battleSetup.defendingTroops}

Score both strategies, then determine winner and casualties.
Strategy reference:
${buildStrategyKnowledgeBase()}`;
}

function buildNarrativePrompt(
  battleSetup: BattleSetup,
  outcome: FinalBattleOutcome,
  attackerRemaining: number,
  defenderRemaining: number
): string {
  const attackerLabel = battleSetup.attackerName ?? 'Attacker';
  const defenderLabel = battleSetup.defenderName ?? 'Defender';
  const winnerLabel = outcome.winner === 'attacker' ? attackerLabel : defenderLabel;

  return `${formatResolvedOutcome(outcome, battleSetup, attackerRemaining, defenderRemaining)}

Attacker (${attackerLabel}) strategy score: ${outcome.attackerStrategyScore}/10
Defender (${defenderLabel}) strategy score: ${outcome.defenderStrategyScore}/10

Attacker plan: ${battleSetup.attackerStrategyText || '(none)'}
Defender plan: ${battleSetup.defenderStrategyText || '(none)'}

Write the battle narrative for this EXACT outcome. The winner is ${winnerLabel} (${outcome.winner}).
${outcome.winner === 'attacker' ? `${attackerLabel} conquered ${battleSetup.defendingTerritory.name}.` : `${defenderLabel} held ${battleSetup.defendingTerritory.name}.`}
Casualties: attacker lost ${battleSetup.attackingTroops - attackerRemaining} (${attackerRemaining} remain), defender lost ${battleSetup.defendingTroops - defenderRemaining} (${defenderRemaining} remain).`;
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function parseResolutionResponse(text: string): RawResolutionResponse {
  const parsed = JSON.parse(extractJsonText(text)) as RawResolutionResponse;
  if (
    typeof parsed.attackerStrategyScore !== 'number' ||
    typeof parsed.defenderStrategyScore !== 'number' ||
    (parsed.winner !== 'attacker' && parsed.winner !== 'defender') ||
    typeof parsed.attackerCasualties !== 'number' ||
    typeof parsed.defenderCasualties !== 'number'
  ) {
    throw new Error('Missing scores or outcome in AI response');
  }
  return parsed;
}

function parseNarrativeResponse(text: string): RawNarrativeResponse {
  const parsed = JSON.parse(extractJsonText(text)) as RawNarrativeResponse;
  if (!parsed.narrativeSummary || !parsed.battlePhases?.length) {
    throw new Error('Incomplete narrative in AI response');
  }
  return parsed;
}

function fallbackNarrative(
  battleSetup: BattleSetup,
  outcome: FinalBattleOutcome,
  attackerRemaining: number,
  defenderRemaining: number
): RawNarrativeResponse {
  const winnerName =
    outcome.winner === 'attacker'
      ? battleSetup.attackerName ?? 'The attacker'
      : battleSetup.defenderName ?? 'The defender';
  const atkLost = battleSetup.attackingTroops - attackerRemaining;
  const defLost = battleSetup.defendingTroops - defenderRemaining;

  return {
    narrativeSummary: `${winnerName} won the battle for ${battleSetup.defendingTerritory.name}. The attacker lost ${atkLost} troops (${attackerRemaining} remaining) and the defender lost ${defLost} troops (${defenderRemaining} remaining).`,
    keyMoment: `The turning point came when ${winnerName}'s forces broke through the main line.`,
    battlePhases: [
      {
        phase: 1,
        title: 'Initial Clash',
        description: `Forces engaged on the approach to ${battleSetup.defendingTerritory.name}.`,
        momentumShift: 'none',
        animationCue: 'advance',
      },
      {
        phase: 2,
        title: 'Main Engagement',
        description: 'Both sides committed reserves as casualties mounted.',
        momentumShift: outcome.winner,
        animationCue: 'clash',
      },
      {
        phase: 3,
        title: 'Decisive Action',
        description: `${winnerName} secured victory.`,
        momentumShift: outcome.winner,
        animationCue: 'finish',
      },
    ],
  };
}

function formatGeminiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);

  if (/Unterminated string|JSON\.parse|incomplete JSON/i.test(message)) {
    return new Error(
      'AI returned incomplete JSON (response may have been cut off). Click Try Again.'
    );
  }
  if (/quota|RESOURCE_EXHAUSTED|429/i.test(message)) {
    return new Error(
      'Gemini API quota exceeded. Wait a few minutes, then try again.'
    );
  }
  if (/404|NOT_FOUND|no longer available/i.test(message)) {
    return new Error(
      'Gemini model unavailable. Set GEMINI_MODEL=gemini-2.5-flash in .env.local and restart the dev server.'
    );
  }
  if (/API key|401|403|invalid.*key/i.test(message)) {
    return new Error('Invalid Gemini API key. Check GEMINI_API_KEY in .env.local.');
  }

  return error instanceof Error ? error : new Error(message);
}

async function requestGeminiJson(
  client: GoogleGenAI,
  systemInstruction: string,
  prompt: string,
  schema: typeof RESOLUTION_SCHEMA | typeof NARRATIVE_SCHEMA,
  temperature: number,
  seed: number
): Promise<string> {
  const response = await client.models.generateContent({
    model: GAME_CONFIG.AI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      temperature,
      topP: 0.85,
      maxOutputTokens: GAME_CONFIG.AI_MAX_TOKENS,
      responseMimeType: 'application/json',
      responseSchema: schema,
      seed,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

export async function simulateBattle(battleSetup: BattleSetup): Promise<BattleResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const client = new GoogleGenAI({ apiKey });
  const { attacker, defender } = sanitizeBattleStrategies(
    battleSetup.attackerStrategyText,
    battleSetup.defenderStrategyText
  );

  const effectiveSetup: BattleSetup = {
    ...battleSetup,
    attackerStrategyText: attacker.hasRealisticContent ? attacker.sanitized : '',
    defenderStrategyText: defender.hasRealisticContent ? defender.sanitized : '',
  };

  const seed = battleSetupSeedInt32(effectiveSetup);
  const resolutionPrompt = buildResolutionPrompt(battleSetup, attacker, defender);

  try {
    // Phase 1: AI scores strategies and proposes winner + casualties
    let resolution: RawResolutionResponse | null = null;
    let lastError: unknown;

    for (const temperature of [0.15, 0.1]) {
      try {
        const text = await requestGeminiJson(
          client,
          RESOLUTION_SYSTEM_PROMPT,
          resolutionPrompt,
          RESOLUTION_SCHEMA,
          temperature,
          seed
        );
        resolution = parseResolutionResponse(text);
        break;
      } catch (err) {
        lastError = err;
        if (!(err instanceof SyntaxError) && !(err instanceof Error && /incomplete JSON/i.test(err.message))) {
          throw err;
        }
      }
    }

    if (!resolution) {
      throw lastError ?? new Error('Failed to parse AI resolution response');
    }

    const atkScore = realismScoreCap(attacker, resolution.attackerStrategyScore);
    const defScore = realismScoreCap(defender, resolution.defenderStrategyScore);

    // Baseline from deterministic formula (sanity check reference)
    const baseline = resolveBattle(effectiveSetup, atkScore, defScore);

    // Phase 2: accept AI outcome unless impossible or implausible
    const outcome: FinalBattleOutcome = validateAndMergeOutcome(
      battleSetup,
      {
        winner: resolution.winner,
        attackerCasualties: resolution.attackerCasualties,
        defenderCasualties: resolution.defenderCasualties,
      },
      { ...baseline, attackerStrategyScore: atkScore, defenderStrategyScore: defScore }
    );

    if (outcome.outcomeSource !== 'ai') {
      console.info(
        `Battle outcome ${outcome.outcomeSource}: AI proposed ${resolution.winner} (${resolution.attackerCasualties}/${resolution.defenderCasualties} casualties), ` +
          `final ${outcome.winner} (${outcome.attackerCasualties}/${outcome.defenderCasualties})`
      );
    }

    const attackerRemaining = Math.max(
      0,
      battleSetup.attackingTroops - outcome.attackerCasualties
    );
    const defenderRemaining = Math.max(
      0,
      battleSetup.defendingTroops - outcome.defenderCasualties
    );

    // Phase 3: narrative matched to validated final outcome
    let narrative: RawNarrativeResponse;
    const narrativePrompt = buildNarrativePrompt(
      effectiveSetup,
      outcome,
      attackerRemaining,
      defenderRemaining
    );

    try {
      const narrativeText = await requestGeminiJson(
        client,
        NARRATIVE_SYSTEM_PROMPT,
        narrativePrompt,
        NARRATIVE_SCHEMA,
        0.2,
        seed + 1
      );
      narrative = parseNarrativeResponse(narrativeText);
    } catch (narrativeErr) {
      console.warn('Narrative generation failed, using fallback:', narrativeErr);
      narrative = fallbackNarrative(
        battleSetup,
        outcome,
        attackerRemaining,
        defenderRemaining
      );
    }

    return {
      winner: outcome.winner,
      attackerStartingTroops: battleSetup.attackingTroops,
      defenderStartingTroops: battleSetup.defendingTroops,
      attackerRemainingTroops: attackerRemaining,
      defenderRemainingTroops: defenderRemaining,
      territoryConquered: outcome.winner === 'attacker',
      battleNarrative: narrative.narrativeSummary,
      phases: narrative.battlePhases ?? [],
      keyMoment: narrative.keyMoment ?? '',
      attackerStrategyAssessment: resolution.attackerStrategyAssessment ?? '',
      defenderStrategyAssessment: resolution.defenderStrategyAssessment ?? '',
      simulationSeed: outcome.simulationSeed,
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw formatGeminiError(error);
  }
}
