// pqRollTrait - the slot trait key a Personal Quest rolls: STR -> strength, TECH -> technical, ART -> artistic.
const TRAITS = { STR: 'strength', TECH: 'technical', ART: 'artistic' };

export function pqRollTrait(def) {
	return TRAITS[def?.roll?.trait] || null;
}
