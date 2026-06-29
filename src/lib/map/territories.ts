import type { TerrainType } from '@/types';

export type ContinentId =
  | 'north_america'
  | 'south_america'
  | 'europe'
  | 'africa'
  | 'asia'
  | 'australia';

export interface MapTerritory {
  id: string;
  name: string;
  continent: ContinentId;
  adjacency: string[];
  terrain?: TerrainType;
}

export const CONTINENT_BONUSES: Record<ContinentId, number> = {
  north_america: 5,
  south_america: 2,
  europe: 5,
  africa: 3,
  asia: 7,
  australia: 2,
};

export const TERRITORIES: MapTerritory[] = [
  // North America
  { id: 'alaska', name: 'Alaska', continent: 'north_america', adjacency: ['northwest_territory', 'alberta', 'kamchatka'], terrain: 'coast' },
  { id: 'northwest_territory', name: 'Northwest Territory', continent: 'north_america', adjacency: ['alaska', 'alberta', 'ontario', 'greenland'], terrain: 'forest' },
  { id: 'greenland', name: 'Greenland', continent: 'north_america', adjacency: ['northwest_territory', 'ontario', 'quebec', 'iceland'], terrain: 'coast' },
  { id: 'alberta', name: 'Alberta', continent: 'north_america', adjacency: ['alaska', 'northwest_territory', 'ontario', 'western_united_states'], terrain: 'plains' },
  { id: 'ontario', name: 'Ontario', continent: 'north_america', adjacency: ['northwest_territory', 'alberta', 'western_united_states', 'eastern_united_states', 'quebec', 'greenland'], terrain: 'forest' },
  { id: 'quebec', name: 'Quebec', continent: 'north_america', adjacency: ['ontario', 'eastern_united_states', 'greenland'], terrain: 'forest' },
  { id: 'western_united_states', name: 'Western United States', continent: 'north_america', adjacency: ['alberta', 'ontario', 'eastern_united_states', 'central_america'], terrain: 'plains' },
  { id: 'eastern_united_states', name: 'Eastern United States', continent: 'north_america', adjacency: ['ontario', 'quebec', 'western_united_states', 'central_america'], terrain: 'plains' },
  { id: 'central_america', name: 'Central America', continent: 'north_america', adjacency: ['western_united_states', 'eastern_united_states', 'venezuela'], terrain: 'forest' },
  // South America
  { id: 'venezuela', name: 'Venezuela', continent: 'south_america', adjacency: ['central_america', 'peru', 'brazil'], terrain: 'forest' },
  { id: 'peru', name: 'Peru', continent: 'south_america', adjacency: ['venezuela', 'brazil', 'argentina'], terrain: 'mountain' },
  { id: 'brazil', name: 'Brazil', continent: 'south_america', adjacency: ['venezuela', 'peru', 'argentina', 'north_africa'], terrain: 'forest' },
  { id: 'argentina', name: 'Argentina', continent: 'south_america', adjacency: ['peru', 'brazil'], terrain: 'plains' },
  // Europe
  { id: 'iceland', name: 'Iceland', continent: 'europe', adjacency: ['greenland', 'great_britain', 'scandinavia'], terrain: 'coast' },
  { id: 'great_britain', name: 'Great Britain', continent: 'europe', adjacency: ['iceland', 'scandinavia', 'northern_europe', 'western_europe'], terrain: 'coast' },
  { id: 'scandinavia', name: 'Scandinavia', continent: 'europe', adjacency: ['iceland', 'great_britain', 'northern_europe', 'ukraine'], terrain: 'forest' },
  { id: 'northern_europe', name: 'Northern Europe', continent: 'europe', adjacency: ['great_britain', 'scandinavia', 'western_europe', 'southern_europe', 'ukraine'], terrain: 'plains' },
  { id: 'western_europe', name: 'Western Europe', continent: 'europe', adjacency: ['great_britain', 'northern_europe', 'southern_europe', 'north_africa'], terrain: 'urban' },
  { id: 'southern_europe', name: 'Southern Europe', continent: 'europe', adjacency: ['western_europe', 'northern_europe', 'ukraine', 'north_africa', 'egypt', 'middle_east'], terrain: 'mountain' },
  { id: 'ukraine', name: 'Ukraine', continent: 'europe', adjacency: ['scandinavia', 'northern_europe', 'southern_europe', 'ural', 'afghanistan', 'middle_east'], terrain: 'plains' },
  // Africa
  { id: 'north_africa', name: 'North Africa', continent: 'africa', adjacency: ['brazil', 'western_europe', 'southern_europe', 'egypt', 'east_africa', 'congo'], terrain: 'desert' },
  { id: 'egypt', name: 'Egypt', continent: 'africa', adjacency: ['southern_europe', 'north_africa', 'east_africa', 'middle_east'], terrain: 'desert' },
  { id: 'east_africa', name: 'East Africa', continent: 'africa', adjacency: ['north_africa', 'egypt', 'congo', 'south_africa', 'madagascar', 'middle_east'], terrain: 'plains' },
  { id: 'congo', name: 'Congo', continent: 'africa', adjacency: ['north_africa', 'east_africa', 'south_africa'], terrain: 'forest' },
  { id: 'south_africa', name: 'South Africa', continent: 'africa', adjacency: ['congo', 'east_africa', 'madagascar'], terrain: 'plains' },
  { id: 'madagascar', name: 'Madagascar', continent: 'africa', adjacency: ['east_africa', 'south_africa'], terrain: 'coast' },
  // Asia
  { id: 'ural', name: 'Ural', continent: 'asia', adjacency: ['ukraine', 'siberia', 'china', 'afghanistan'], terrain: 'mountain' },
  { id: 'siberia', name: 'Siberia', continent: 'asia', adjacency: ['ural', 'yakutsk', 'irkutsk', 'mongolia', 'china'], terrain: 'forest' },
  { id: 'yakutsk', name: 'Yakutsk', continent: 'asia', adjacency: ['siberia', 'kamchatka', 'irkutsk'], terrain: 'forest' },
  { id: 'kamchatka', name: 'Kamchatka', continent: 'asia', adjacency: ['alaska', 'yakutsk', 'irkutsk', 'japan', 'mongolia'], terrain: 'coast' },
  { id: 'irkutsk', name: 'Irkutsk', continent: 'asia', adjacency: ['siberia', 'yakutsk', 'kamchatka', 'mongolia'], terrain: 'forest' },
  { id: 'mongolia', name: 'Mongolia', continent: 'asia', adjacency: ['siberia', 'irkutsk', 'kamchatka', 'japan', 'china'], terrain: 'plains' },
  { id: 'japan', name: 'Japan', continent: 'asia', adjacency: ['kamchatka', 'mongolia'], terrain: 'coast' },
  { id: 'afghanistan', name: 'Afghanistan', continent: 'asia', adjacency: ['ukraine', 'ural', 'china', 'india', 'middle_east'], terrain: 'mountain' },
  { id: 'middle_east', name: 'Middle East', continent: 'asia', adjacency: ['southern_europe', 'ukraine', 'afghanistan', 'india', 'egypt', 'east_africa'], terrain: 'desert' },
  { id: 'india', name: 'India', continent: 'asia', adjacency: ['middle_east', 'afghanistan', 'china', 'siam'], terrain: 'plains' },
  { id: 'china', name: 'China', continent: 'asia', adjacency: ['ural', 'siberia', 'mongolia', 'afghanistan', 'india', 'siam'], terrain: 'mountain' },
  { id: 'siam', name: 'Siam', continent: 'asia', adjacency: ['india', 'china', 'indonesia'], terrain: 'forest' },
  // Australia
  { id: 'indonesia', name: 'Indonesia', continent: 'australia', adjacency: ['siam', 'new_guinea', 'western_australia'], terrain: 'coast' },
  { id: 'new_guinea', name: 'New Guinea', continent: 'australia', adjacency: ['indonesia', 'western_australia', 'eastern_australia'], terrain: 'forest' },
  { id: 'western_australia', name: 'Western Australia', continent: 'australia', adjacency: ['indonesia', 'new_guinea', 'eastern_australia'], terrain: 'desert' },
  { id: 'eastern_australia', name: 'Eastern Australia', continent: 'australia', adjacency: ['new_guinea', 'western_australia'], terrain: 'plains' },
];

const territoryById = new Map(TERRITORIES.map((t) => [t.id, t]));

export function getTerritory(id: string): MapTerritory | undefined {
  return territoryById.get(id);
}

export function areAdjacent(a: string, b: string): boolean {
  const territory = territoryById.get(a);
  return territory?.adjacency.includes(b) ?? false;
}

export function getAdjacent(id: string): MapTerritory[] {
  const territory = territoryById.get(id);
  if (!territory) return [];
  return territory.adjacency
    .map((adjId) => territoryById.get(adjId))
    .filter((t): t is MapTerritory => t !== undefined);
}

export function getGeographyContext(fromId: string, toId: string): string {
  const from = getTerritory(fromId);
  const to = getTerritory(toId);
  if (!from || !to) return '';

  const crossContinent = from.continent !== to.continent;
  const fromBonus = CONTINENT_BONUSES[from.continent];
  const toBonus = CONTINENT_BONUSES[to.continent];

  return [
    `Attacking from ${from.name} (${from.continent.replace(/_/g, ' ')}, terrain: ${from.terrain ?? 'unknown'}, continent bonus: +${fromBonus}).`,
    `Defending ${to.name} (${to.continent.replace(/_/g, ' ')}, terrain: ${to.terrain ?? 'unknown'}, continent bonus: +${toBonus}).`,
    crossContinent
      ? 'This is a cross-continent assault with extended supply lines.'
      : 'Both territories are on the same continent.',
  ].join(' ');
}
