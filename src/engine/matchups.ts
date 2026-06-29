import { getGeographyContext } from '@/lib/map/territories';

export { getGeographyContext };

/** @deprecated Numeric matchups removed — AI evaluates freeform strategies */
export function getGeographySummary(fromId: string, toId: string): string {
  return getGeographyContext(fromId, toId);
}
