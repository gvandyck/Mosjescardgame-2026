// attachmentRules - what an attached card does while it sits on a Mosje (data only, Phase 71-07).
// Koksmes' and Rugbybal's Power is not here: it is a timed effect tied to the attachment (whileAttached, D-02).
// questDie: +amount dice on a Quest whose rolled trait is `trait`. onAttackGain: the Mosje gains `amount` MP each time it
// attacks when it is one of `friends`. firstPiecieDiscount: the owner's first Piecie each turn costs this much less.
export const ATTACHMENT_RULES = {
	piecie_dumbbells: { questDie: { trait: 'strength', amount: 1 } },
	piecie_rugbybal: { onAttackGain: { amount: 10, friends: ['Alyssa'] } },
	piecie_hawaiishirt: { firstPiecieDiscount: 1 },
};
