/**
 * Phase 9 — Registry Bootstrap
 *
 * Importing this module triggers all card registrations by side-effect.
 * Import this ONCE at the start of any simulation run.
 * Do NOT import in vitest tests — they manage their own registry.
 */

// Mosjes
import "../cards/mosjes/fighting/index.js";
import "../cards/mosjes/digital/index.js";
import "../cards/mosjes/artistic/index.js";

// Piecies
import "../cards/piecies/momentum-gaining/index.js";
import "../cards/piecies/attack/index.js";
import "../cards/piecies/utility/index.js";
import "../cards/piecies/conditional/index.js";
import "../cards/piecies/pet/index.js";

// Snelle Piecies
import "../cards/snelle-piecies/index.js";

// Places
import "../cards/places/index.js";

// Quests
import "../cards/quests/general/index.js";
import "../cards/quests/personal/index.js";
