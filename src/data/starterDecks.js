// starterDecks.js — The 3 prebuilt deck configurations players can pick
// in the lobby. Each deck has 2 Mosjes + a set of Piecies, Snelle Piecies,
// Places, and Quests. Card IDs here must match IDs in the other data files.

export const STARTER_DECKS = [
  {
    id: "PHYSICAL_FORCE",
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
      "snelle_lucky_coin"
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
  }
];
