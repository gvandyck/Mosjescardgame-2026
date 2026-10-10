import { EXAMPLE_DECKS } from './exampleDecks.js';

// starterDecks.js — The 3 prebuilt deck configurations players can pick
// in the lobby. Each deck has 2 Mosjes + a set of Piecies, Snelle Piecies,
// Places, and Quests. Card IDs here must match IDs in the other data files.

export const STARTER_DECKS = [
  {
    id: "PHYSICAL_FORCE",
    disabled: true,
    name: "Physical Force",
    description: "Couple power: Gandoe and Michelle's boxing chemistry. Physical quests, place synergies, and the Toennoe hangout.",
    mosjes: ["mosje_gandoe_destroyer", "mosje_michelle"],
    piecies: [
      "piecie_boxing_gloves",
      "piecie_bowie_stormey",
      "piecie_dikke_jonko",
      "piecie_laat_me_chillen",
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_protein_shake",
      "piecie_affoe",
      "piecie_quest_prep",
      "piecie_tikker"
    ],
    snellePiecies: [
      "snelle_negate_elimination",
      "snelle_emergency_healings",
      "snelle_jensen",
      "snelle_chillingsvoorbij"
    ],
    places: [
      "place_boxing_ring",
      "place_eendjes_voeren"
    ],
    quests: [
      "quest_personal_kickboxing_bootcamp"
    ]
  },
  {
    id: "DIGITAL_CONTROL",
    disabled: true,
    name: "Digital Control",
    description: "Coert and Binti's Tesla loop: FOOD synergy, quest economy, and the Winston Jaaa auto-quest combo.",
    mosjes: ["mosje_coert_tech", "mosje_binti"],
    piecies: [
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_varkenspootjes",
      "piecie_pot_of_weed",
      "piecie_quest_prep",
      "piecie_quest_prep",
      "piecie_bong_hit_demolition",
      "piecie_redbull",
      "piecie_keyboard",
      "piecie_controller"
    ],
    snellePiecies: [
      "snelle_jensen",
      "snelle_jensen",
      "snelle_lucky_coin",
      "snelle_counter_strikka"
    ],
    places: [
      "place_tesla",
      "place_bank_chilling"
    ],
    quests: [
      "quest_personal_winston_tijd"
    ]
  },
  {
    id: "ARTISTIC_RHYTHM",
    disabled: true,
    name: "Artistic Rhythm",
    description: "Youri and Chris DDR: speedrun combos, piecie chains, and creative quest pressure.",
    mosjes: ["mosje_youri", "mosje_chris_ddr"],
    piecies: [
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_affoe",
      "piecie_affoe",
      "piecie_pot_of_weed",
      "piecie_quest_prep",
      "piecie_quest_prep",
      "piecie_controller",
      "piecie_synergy_field",
      "piecie_grammetje_pieter"
    ],
    snellePiecies: [
      "snelle_lucky_coin",
      "snelle_lucky_coin",
      "snelle_jensen",
      "snelle_ff_haaltje_nemen"
    ],
    places: [
      "place_quest_haven",
      "place_bank_chilling"
    ],
    quests: [
      "quest_improvise"
    ]
  },

  // ─────────────────────────────────────────
  // SYNERGY DUO DECKS — each built around one
  // Mosje pair and the cards that flow with them.
  // ─────────────────────────────────────────

  {
    id: "DUO_COERT_BINTI",
    disabled: true,
    name: "Coert & Binti — Winston's Kitchen",
    description: "Coert KasteLuck + Binti double every FOOD Piecie. Stack Kannetjes, feed Binti Varkenspootjes for +60, and let Coert's Caravan keep the momentum coming.",
    mosjes: ["mosje_coert_kasteluck", "mosje_binti"],
    piecies: [
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_broodje_doner",
      "piecie_varkenspootjes",
      "piecie_warm_kannetje_melk",
      "piecie_pot_of_weed",
      "piecie_redbull",
      "piecie_quest_prep",
      "piecie_bagga_of_greed"
    ],
    snellePiecies: [
      "snelle_jensen",
      "snelle_ff_haaltje_nemen",
      "snelle_momentum_rush",
      "snelle_sleutelpuntje"
    ],
    places: [
      "place_coerts_caravan",
      "place_bank_chilling"
    ],
    quests: [
      "quest_inspire_crowd"
    ]
  },
  {
    id: "DUO_GANDOE_MICHELLE",
    disabled: true,
    name: "Gandoe & Michelle — The Box",
    description: "Boxing chemistry: De Box and the Boxing Ring pump both fighters every turn, Tony & Bowie halve the hits, and Kickboxing Bootcamp pays out big when they train together.",
    mosjes: ["mosje_gandoe_destroyer", "mosje_michelle"],
    piecies: [
      "piecie_boxing_gloves",
      "piecie_protein_shake",
      "piecie_dumbbells",
      "piecie_tony",
      "piecie_bowie_stormey",
      "piecie_kannetje_melk",
      "piecie_laat_me_chillen",
      "piecie_quest_prep",
      "piecie_tikker",
      "piecie_dikke_jonko"
    ],
    snellePiecies: [
      "snelle_jensen",
      "snelle_emergency_healings",
      "snelle_negate_elimination",
      "snelle_sleutelpuntje"
    ],
    places: [
      "place_de_box",
      "place_boxing_ring"
    ],
    quests: [
      "quest_personal_kickboxing_bootcamp"
    ]
  },
  {
    id: "DUO_CHRIS_YOURI",
    disabled: true,
    name: "Chris & Youri — Instant Setup",
    description: "Their synergy skips the face-down wait, so Piecies fire the turn they land. Youri speed-activates, Chris cashes in the setup, and the Digital gear keeps the chain rolling.",
    mosjes: ["mosje_chris", "mosje_youri"],
    piecies: [
      "piecie_keyboard",
      "piecie_mouse",
      "piecie_controller",
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_chain_reaction",
      "piecie_dubbele_ding",
      "piecie_pot_of_weed",
      "piecie_quest_prep",
      "piecie_te_hard_gaan"
    ],
    snellePiecies: [
      "snelle_jensen",
      "snelle_dubbele_temminks",
      "snelle_counter_strikka",
      "snelle_sleutelpuntje"
    ],
    places: [
      "place_arcade",
      "place_momentum_factory"
    ],
    quests: [
      "quest_speed_run"
    ]
  },
  {
    id: "DUO_JISCA_ALYSSA",
    disabled: true,
    name: "Jisca & Alyssa — Encore Bulldozer",
    description: "Jisca chains Piecie after Piecie while Alyssa turns every hit into a comeback. Both pets on the field cut damage up to 80%, and Battle Concert bounces Alyssa's failures onto the enemy.",
    mosjes: ["mosje_jisca", "mosje_alyssa_bulldozer"],
    piecies: [
      "piecie_gekke_vogels",
      "piecie_katjegang",
      "piecie_battle_concert",
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_affoe",
      "piecie_grammetje_pieter",
      "piecie_chain_reaction",
      "piecie_te_hard_gaan",
      "piecie_pot_of_weed"
    ],
    snellePiecies: [
      "snelle_jensen",
      "snelle_dubbele_temminks",
      "snelle_bijna_welloe",
      "snelle_the_protector"
    ],
    places: [
      "place_dierenasiel",
      "place_bank_chilling"
    ],
    quests: [
      "quest_inspire_crowd"
    ]
  },
  {
    id: "DUO_WEST_CLESS",
    disabled: true,
    name: "West & Cless — Calculated Chaos",
    description: "Señor West's reads and Cless's wild rolls both cash in Physical Quests for +15. The Gym and Obby reward the muscle, ViannaPoes guards Cless, and F1 Telemetry + Those Eyelashes punish the opponent's hand.",
    mosjes: ["mosje_martin_senor_west", "mosje_azn_cless"],
    piecies: [
      "piecie_vianna_poes",
      "piecie_those_eyelashes",
      "piecie_f1_telemetry",
      "piecie_jantje_jantje",
      "piecie_stookerino",
      "piecie_kannetje_melk",
      "piecie_quest_prep",
      "piecie_dumbbells",
      "piecie_grammetje_pieter",
      "piecie_te_hard_gaan"
    ],
    snellePiecies: [
      "snelle_jensen",
      "snelle_counter_strikka",
      "snelle_jammertje_gepakt",
      "snelle_sleutelpuntje"
    ],
    places: [
      "place_the_gym",
      "place_obby_1"
    ],
    quests: [
      "quest_arm_wrestling"
    ]
  },
  ...EXAMPLE_DECKS,
];
