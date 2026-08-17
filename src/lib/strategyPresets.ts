export interface StrategyPreset {
  id: string;
  label: string;
  text: string;
}

export const ATTACKER_PRESETS: StrategyPreset[] = [
  {
    id: 'frontal',
    label: 'Frontal Assault',
    text: 'Charge straight at their line with full force. Overwhelm them with numbers and momentum before they can dig in.',
  },
  {
    id: 'pincer',
    label: 'Pincer Attack',
    text: 'Split into two flanks and squeeze them from both sides. Keep a small center force to pin them while the wings close.',
  },
  {
    id: 'night-raid',
    label: 'Night Raid',
    text: 'Strike at night for surprise. Hit their supply and command first, then collapse the rest before they reorganize.',
  },
  {
    id: 'scorched',
    label: 'Scorched Earth',
    text: 'Burn and deny their resources as we advance. Force them to fight hungry and exposed, then finish the push.',
  },
  {
    id: 'feint',
    label: 'Feint & Flank',
    text: 'Fake a frontal push to draw them out, then swing hard around the weak flank and break through.',
  },
];

export const DEFENDER_PRESETS: StrategyPreset[] = [
  {
    id: 'shield-wall',
    label: 'Shield Wall',
    text: 'Hold a tight defensive line. Absorb the first wave, keep ranks locked, and counter when they overextend.',
  },
  {
    id: 'turtle',
    label: 'Turtle Up',
    text: 'Dig in and conserve troops. Refuse open battle until they exhaust themselves, then strike the gaps.',
  },
  {
    id: 'fortified',
    label: 'Fortified Position',
    text: 'Use terrain and fortifications. Funnel them into chokepoints where our smaller force can hold.',
  },
  {
    id: 'counter',
    label: 'Counter-Attack',
    text: 'Let them commit, then counter hard at the point of overreach. Trade ground for a decisive blow.',
  },
  {
    id: 'ambush',
    label: 'Ambush',
    text: 'Hide part of our force and bait them forward. Spring the trap once they are deep and overconfident.',
  },
];

export function getPresetsForSide(side: 'attacker' | 'defender'): StrategyPreset[] {
  return side === 'attacker' ? ATTACKER_PRESETS : DEFENDER_PRESETS;
}
