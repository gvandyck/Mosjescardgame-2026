// pqValues - every tuning number of Phase 73 (CC-10). Data only: later plans read these, tuning is a one-file change.
export const PQ_VALUES = {
	GROW_WEIGHT: 2.0, // a growing keeper's Quest value counts this much more (CC-2)
	KEEPER_ATTACK_WEIGHT: 0.25, // a growing keeper's ordinary attack counts this much (CC-2)
	FINISH_DROP: 100, // a slot-worth drop of this much makes an attack a finishing blow (CC-2)
	NEAR_L3_MP: 60, // a Level 2 keeper with this much MP is about one good turn from Level 3 (CC-5)
	PUNTO_BANCO_FIT: 8, // placeFit of Punto Banco for a bot with a settled Mosje (CC-6)
	PUNTO_QUEST_ENERGY: 2, // spare Energy needed to call 'punto' on an ordinary Quest roll (CC-6)
	PUNTO_QUEST_MAX_CHANCE: 0.85, // no 'punto' call on a Quest whose win chance is already this high (CC-6)
	FPS_WEST_MIN_MP: 45, // FPS West must have this much MP before its ability is pressed (CC-8)
	FPS_WEST_SPARE_ENERGY: 2, // spare Energy needed to press FPS West (CC-8)
};
