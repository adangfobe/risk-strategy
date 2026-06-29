import { GoogleGenAI, Type } from '@google/genai';
import type { BattleSetup, BattleResult, BattlePhase } from '@/types';
import { GAME_CONFIG } from '@/lib/config/gameParams';
import { getGeographyContext } from '@/lib/map/territories';
import { allStrategies } from '@/strategies';

const SIMULATION_SYSTEM_PROMPT = `You are a world-class military historian simulating a Risk-style board game battle.

Judge each side's spoken strategy against troop counts, geography, terrain, and adjacency. Return ONLY valid JSON matching the schema — no markdown, no commentary.

Output rules (critical):
- Exactly 3 battle phases, each description max 2 sentences
- narrativeSummary max 4 sentences
- Each assessment max 3 sentences
- keyMoment: 1 sentence
- Do NOT use double-quote characters inside string values — use single quotes instead
- Do NOT use newline characters inside string values
- Ensure the JSON is complete and properly closed`;

interface RawSimulationResponse {
  winner: 'attacker' | 'defender';
  attackerCasualties: number;
  defenderCasualties: number;
  battlePhases: BattlePhase[];
  narrativeSummary: string;
  keyMoment: string;
  attackerStrategyAssessment: string;
  defenderStrategyAssessment: string;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    winner: { type: Type.STRING, enum: ['attacker', 'defender'] },
    attackerCasualties: { type: Type.NUMBER },
    defenderCasualties: { type: Type.NUMBER },
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
    attackerStrategyAssessment: { type: Type.STRING },
    defenderStrategyAssessment: { type: Type.STRING },
  },
  required: [
    'winner',
    'attackerCasualties',
    'defenderCasualties',
    'battlePhases',
    'narrativeSummary',
    'keyMoment',
    'attackerStrategyAssessment',
    'defenderStrategyAssessment',
  ],
};

function buildStrategyKnowledgeBase(): string {
  return allStrategies
    .map((s) => `- ${s.name}: ${s.tacticalDescription.trim().slice(0, 80)}`)
    .join('\n');
}

function buildSimulationPrompt(battleSetup: BattleSetup): string {
  const geography = getGeographyContext(
    battleSetup.attackingTerritory.id,
    battleSetup.defendingTerritory.id
  );

  return `Simulate this battle:

ATTACKER (${battleSetup.attackingTroops} troops):
- From: ${battleSetup.attackingTerritory.name}
- Strategy: ${battleSetup.attackerStrategyText}

DEFENDER (${battleSetup.defendingTroops} troops):
- Territory: ${battleSetup.defendingTerritory.name}
- Strategy: ${battleSetup.defenderStrategyText}

GEOGRAPHY: ${geography}
Troop ratio: ${battleSetup.attackingTroops} vs ${battleSetup.defendingTroops}

Strategy reference (inspiration only):
${buildStrategyKnowledgeBase()}`;
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

function parseSimulationResponse(text: string): RawSimulationResponse {
  const jsonText = extractJsonText(text);

  let parsed: RawSimulationResponse;
  try {
    parsed = JSON.parse(jsonText) as RawSimulationResponse;
  } catch {
    throw new Error(
      'AI returned incomplete JSON (response may have been cut off). Click Try Again.'
    );
  }

  if (parsed.winner !== 'attacker' && parsed.winner !== 'defender') {
    throw new Error('Invalid winner in AI response');
  }
  if (
    typeof parsed.attackerCasualties !== 'number' ||
    typeof parsed.defenderCasualties !== 'number'
  ) {
    throw new Error('Missing casualty counts in AI response');
  }

  return parsed;
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

async function requestSimulation(
  client: GoogleGenAI,
  prompt: string,
  temperature: number
): Promise<string> {
  const response = await client.models.generateContent({
    model: GAME_CONFIG.AI_MODEL,
    contents: prompt,
    config: {
      systemInstruction: SIMULATION_SYSTEM_PROMPT,
      temperature,
      maxOutputTokens: GAME_CONFIG.AI_MAX_TOKENS,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return text;
}

export async function simulateBattle(battleSetup: BattleSetup): Promise<BattleResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const client = new GoogleGenAI({ apiKey });
  const prompt = buildSimulationPrompt(battleSetup);

  try {
    let parsed: RawSimulationResponse | null = null;
    let lastError: unknown;

    // Retry once on JSON parse failure (often caused by truncated output)
    for (const temperature of [0.5, 0.3]) {
      try {
        const text = await requestSimulation(client, prompt, temperature);
        parsed = parseSimulationResponse(text);
        break;
      } catch (err) {
        lastError = err;
        if (!(err instanceof SyntaxError) && !(err instanceof Error && /incomplete JSON/i.test(err.message))) {
          throw err;
        }
      }
    }

    if (!parsed) {
      throw lastError ?? new Error('Failed to parse AI response');
    }

    const result: BattleResult = {
      winner: parsed.winner,
      attackerStartingTroops: battleSetup.attackingTroops,
      defenderStartingTroops: battleSetup.defendingTroops,
      attackerRemainingTroops: Math.max(0, battleSetup.attackingTroops - parsed.attackerCasualties),
      defenderRemainingTroops: Math.max(0, battleSetup.defendingTroops - parsed.defenderCasualties),
      territoryConquered: parsed.winner === 'attacker',
      battleNarrative: parsed.narrativeSummary,
      phases: parsed.battlePhases ?? [],
      keyMoment: parsed.keyMoment ?? '',
      attackerStrategyAssessment: parsed.attackerStrategyAssessment ?? '',
      defenderStrategyAssessment: parsed.defenderStrategyAssessment ?? '',
      simulationSeed: Date.now().toString(),
    };

    return result;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw formatGeminiError(error);
  }
}
