import { gandoeWizardChaosRoll } from '../../abilities/mosje/gandoeWizardChaosRoll.js';
import { aznClessRiskReward } from '../../abilities/mosje/aznClessRiskReward.js';
import { alyssaFissaPartyPower } from '../../abilities/mosje/alyssaFissaPartyPower.js';
import { michelleToughGamble } from '../../abilities/mosje/michelleToughGamble.js';
import { parkourWestFlowQuest } from '../../abilities/mosje/parkourWestFlowQuest.js';
import { coertTechExtraResources } from '../../abilities/mosje/coertTechExtraResources.js';
import { fpsCoertHeadshot } from '../../abilities/mosje/fpsCoertHeadshot.js';
import { fpsWestTacticalAnalysis } from '../../abilities/mosje/fpsWestTacticalAnalysis.js';
import { drainerContinuousDrain } from '../../abilities/mosje/drainerContinuousDrain.js';
import { jiscaPerfectCombo } from '../../abilities/mosje/jiscaPerfectCombo.js';
import { ddrChrisComboChain } from '../../abilities/mosje/ddrChrisComboChain.js';
import { clessTeachingMoment } from '../../abilities/mosje/clessTeachingMoment.js';
import { jeffreyBruteForce } from '../../abilities/mosje/jeffreyBruteForce.js';
import { martinDriverPerfectLine } from '../../abilities/mosje/martinDriverPerfectLine.js';
import { gandoeDestroyerStrikeChoice } from '../../abilities/mosje/gandoeDestroyerStrikeChoice.js';
import { bintiDiscardChoice } from '../../abilities/mosje/bintiDiscardChoice.js';
// MOSJE_TRIGGERS — push-only registry of 2.0 Mosje trigger hooks (like ATTACK_TRIGGERS).
// Entry: { mosjeId, run(state, ctx), available?(state, playerId) } (see runMosjeTriggers).
// startOfTurn/endOfTurn/questSuccess/piecieActivated/placeDestroyed/cardPlayedFromHand return state
// (or { needChoice }); questWinAmount returns the running number; oppStartOfTurn runs for the
// NON-active player's field; an entry with onOpponent:true runs for the player(s) who did NOT act (FPS West); drawStep entries use available() to offer a draw-step option.
export const MOSJE_TRIGGERS = {
	startOfTurn: [gandoeWizardChaosRoll],
	oppStartOfTurn: [drainerContinuousDrain],
	endOfTurn: [aznClessRiskReward, fpsWestTacticalAnalysis],
	questWinAmount: [michelleToughGamble],
	questSuccess: [parkourWestFlowQuest, fpsCoertHeadshot, jeffreyBruteForce, martinDriverPerfectLine],
	// piecieActivated order on one activation (Card List ruling): Jisca, then Dancing/DDR Chris, then Cless, The Teacher.
	piecieActivated: [jiscaPerfectCombo, ddrChrisComboChain, clessTeachingMoment],
	placeDestroyed: [alyssaFissaPartyPower],
	cardPlayedFromHand: [fpsWestTacticalAnalysis],
	drawStep: [coertTechExtraResources],
	// Binti's Cutting Words fires this directly (not from runMosjeTriggers) so the opponent's discard pick can pause.
	bintiDiscard: [bintiDiscardChoice],
	// Gandoe, The Destroyer's Elimination Strike resolves here so a tie can pause for the owner's pick.
	destroyerStrike: [gandoeDestroyerStrikeChoice],
};
