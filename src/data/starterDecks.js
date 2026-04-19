// starterDecks.js — The 3 prebuilt deck configurations players can pick
// in the lobby. Each deck has 2 Mosjes + a set of Piecies, Snelle Piecies,
// Places, and Quests. Card IDs here must match IDs in the other data files.

export const STARTER_DECKS = [
  {
    id: "PHYSICAL_FORCE",
    name: "Physical Force",
    description: "Raw power and Quest dominance. Best for aggressive players who want big MP swings.",
    mosjes: ["mosje_jeffrey", "mosje_michelle"],
    piecies: [
      // 2x copies of high-value FOOD and attack cards
      "piecie_broodje_doner",
      "piecie_broodje_doner",
      "piecie_affoe",
      "piecie_affoe",
      "piecie_quest_prep",
      "piecie_quest_prep",
      "piecie_gun_een_piece",
      "piecie_slecht_gezet"
    ],
    snellePiecies: [
      "snelle_emergency_healings",
      "snelle_emergency_healings",
      "snelle_ff_haaltje_nemen",
      "snelle_lucky_coin"
    ],
    places: [
      "place_the_gym",
      "place_quest_haven"
    ],
    quests: [
      "quest_personal_iron_will"
    ]
  },
  {
    id: "DIGITAL_CONTROL",
    name: "Digital Control",
    description: "Card draw, MP efficiency, and tech synergies. Best for strategic players.",
    mosjes: ["mosje_west", "mosje_coert_tech"],
    piecies: [
      "piecie_gun_een_piece",
      "piecie_gun_een_piece",
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_quest_prep",
      "piecie_quest_prep",
      "piecie_affoe",
      "piecie_slecht_gezet"
    ],
    snellePiecies: [
      "snelle_jensen",
      "snelle_jensen",
      "snelle_lucky_coin",
      "snelle_lucky_coin"
    ],
    places: [
      "place_bank_chilling",
      "place_quest_haven"
    ],
    quests: [
      "quest_personal_perfect_sync"
    ]
  },
  {
    id: "ARTISTIC_RHYTHM",
    name: "Artistic Rhythm",
    description: "Social pressure and creative combos. Best for players who like disrupting opponents.",
    mosjes: ["mosje_binti", "mosje_dj_8020"],
    piecies: [
      "piecie_kannetje_melk",
      "piecie_kannetje_melk",
      "piecie_affoe",
      "piecie_affoe",
      "piecie_gun_een_piece",
      "piecie_gun_een_piece",
      "piecie_quest_prep",
      "piecie_slecht_gezet"
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
      "quest_personal_lucky_crescendo"
    ]
  }
];
