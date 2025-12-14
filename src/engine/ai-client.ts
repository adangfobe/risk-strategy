import Anthropic from '@anthropic-ai/sdk';
import type { BattleSetup, BattleResult, BattlePhase } from '@/types';
import { GAME_CONFIG } from '@/lib/config/gameParams';
import { calculateMatchup, getMatchupAdvantage, getMatchupAdvantageStrength } from './matchups';

const SIMULATION_SYSTEM_PROMPT = `You are a military tactician simulating a battle between two forces in a Risk-style board game.

Your task is to:
1. Analyze the tactical situation based on troop counts, strategies, and matchup advantages
2. Determine a realistic battle outcome considering strategy effectiveness and troop ratios
3. Generate a vivid, engaging battle narrative
4. Break down the battle into 2-4 distinct phases with key moments

Rules:
- Even the winning side suffers casualties (minimum 10% for winners, 50% for losers)
- Strategy matchups matter: a strong matchup gives a 30% advantage, weak matchup gives 30% penalty
- Troop ratios matter: larger forces have better odds, but upsets are possible (up to 25% chance)
- The narrative should reflect the strategies used (e.g., pincer attacks show flanking, shield walls show defensive formations)
- Make the battle feel dynamic with momentum shifts

Return your response as JSON with this structure:
{
  "winner": "attacker" | "defender",
  "attackerCasualties": number,
  "defenderCasualties": number,
  "battlePhases": [
    {
      "phase": number,
      "title": string,
      "description": string,
      "momentumShift": "attacker" | "defender" | "none",
      "animationCue": string
    }
  ],
  "narrativeSummary": string,
  "keyMoment": string
}`;

function buildSimulationPrompt(battleSetup: BattleSetup, matchupAdvantage: 'attacker' | 'defender' | 'neutral', advantageStrength: number): string {
  const attackerStrategy = battleSetup.attackerStrategy;
  const defenderStrategy = battleSetup.defenderStrategy;
  
  return `Simulate a battle with the following parameters:

ATTACKER:
- Troops: ${battleSetup.attackingTroops}
- Strategy: ${attackerStrategy.name}
- Strategy Description: ${attackerStrategy.description}
- Tactical Approach: ${attackerStrategy.tacticalDescription}
${attackerStrategy.historicalReference ? `- Historical Reference: ${attackerStrategy.historicalReference}` : ''}

DEFENDER:
- Troops: ${battleSetup.defendingTroops}
- Strategy: ${defenderStrategy.name}
- Strategy Description: ${defenderStrategy.description}
- Tactical Approach: ${defenderStrategy.tacticalDescription}
${defenderStrategy.historicalReference ? `- Historical Reference: ${defenderStrategy.historicalReference}` : ''}

MATCHUP ANALYSIS:
- Advantage: ${matchupAdvantage}
- Advantage Strength: ${(advantageStrength * 100).toFixed(0)}%
- Troop Ratio: ${battleSetup.attackingTroops} vs ${battleSetup.defendingTroops} (${((battleSetup.attackingTroops / (battleSetup.attackingTroops + battleSetup.defendingTroops)) * 100).toFixed(0)}% attacker)

TERRITORIES:
- Attacking from: ${battleSetup.attackingTerritory.name} (${battleSetup.attackingTerritory.continent})
- Defending: ${battleSetup.defendingTerritory.name} (${battleSetup.defendingTerritory.continent})

Generate a realistic battle simulation considering these factors.`;
}

function parseSimulationResponse(response: Anthropic.Messages.Message): BattleResult | null {
  try {
    // Extract text content from the response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    // Try to extract JSON from the response
    const text = content.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and transform the response
    if (!parsed.winner || !parsed.attackerCasualties || !parsed.defenderCasualties) {
      throw new Error('Missing required fields in response');
    }

    const attackerCasualties = parsed.attackerCasualties || 0;
    const defenderCasualties = parsed.defenderCasualties || 0;

    return {
      winner: parsed.winner,
      attackerStartingTroops: 0, // Will be set by caller
      defenderStartingTroops: 0, // Will be set by caller
      attackerRemainingTroops: 0, // Will be calculated
      defenderRemainingTroops: 0, // Will be calculated
      territoryConquered: parsed.winner === 'attacker',
      battleNarrative: parsed.narrativeSummary || parsed.narrative || '',
      phases: parsed.battlePhases || [],
      keyMoment: parsed.keyMoment || '',
      strategyMatchup: {
        attackerStrategy: '',
        defenderStrategy: '',
        attackerModifier: 1.0,
        defenderModifier: 1.0,
        narrativeHint: '',
      },
      simulationSeed: Date.now().toString(),
      // Store casualties for calculation
      _attackerCasualties: attackerCasualties,
      _defenderCasualties: defenderCasualties,
    } as BattleResult & { _attackerCasualties: number; _defenderCasualties: number };
  } catch (error) {
    console.error('Error parsing simulation response:', error);
    return null;
  }
}

export async function simulateBattle(battleSetup: BattleSetup): Promise<BattleResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  const client = new Anthropic({ apiKey });
  
  const matchup = calculateMatchup(battleSetup.attackerStrategy, battleSetup.defenderStrategy);
  const matchupAdvantage = getMatchupAdvantage(battleSetup.attackerStrategy, battleSetup.defenderStrategy);
  const advantageStrength = getMatchupAdvantageStrength(battleSetup.attackerStrategy, battleSetup.defenderStrategy);

  const prompt = buildSimulationPrompt(battleSetup, matchupAdvantage, advantageStrength);

  try {
    const response = await client.messages.create({
      model: GAME_CONFIG.AI_MODEL,
      max_tokens: GAME_CONFIG.AI_MAX_TOKENS,
      temperature: GAME_CONFIG.AI_TEMPERATURE,
      system: SIMULATION_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const result = parseSimulationResponse(response);
    
    if (!result) {
      return null;
    }

    // Fill in the missing fields
    const casualties = result as BattleResult & { _attackerCasualties?: number; _defenderCasualties?: number };
    const attackerCasualties = casualties._attackerCasualties || 0;
    const defenderCasualties = casualties._defenderCasualties || 0;
    
    result.attackerStartingTroops = battleSetup.attackingTroops;
    result.defenderStartingTroops = battleSetup.defendingTroops;
    result.attackerRemainingTroops = Math.max(0, battleSetup.attackingTroops - attackerCasualties);
    result.defenderRemainingTroops = Math.max(0, battleSetup.defendingTroops - defenderCasualties);
    result.strategyMatchup = matchup;
    
    // Clean up temporary fields
    delete (result as any)._attackerCasualties;
    delete (result as any)._defenderCasualties;

    return result;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
}

