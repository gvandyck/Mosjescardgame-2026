// Dev-only data: `stays` per card id (14 non-null). Everything else is null.
export const STAYS_BY_ID = {
  piecie_continuous_assault: 'endOfNextTurn',
  piecie_synergy_field: 'endOfNextTurn',
  piecie_laat_me_chillen: 'endOfNextTurn',
  piecie_mosje_shield: 'endOfNextTurn',
  piecie_afblijven: 'startOfNextTurn',
  piecie_welloe_force: 'startOfNextTurn',
  piecie_kleine_taks: 'custom',
  piecie_call_of_welloes: 'custom',
  piecie_bowie_stormey: 'endOfNextTurn',
  piecie_tony: 'endOfNextTurn',
  piecie_gekke_vogels: 'endOfNextTurn',
  piecie_katjegang: 'endOfNextTurn',
  piecie_vianna_poes: 'endOfNextTurn',
  snelle_blensen: 'endOfTurn',
  // Tikker and MP Hemorrhage deliberately stay null (TODO(phase 59): confirm).
};
