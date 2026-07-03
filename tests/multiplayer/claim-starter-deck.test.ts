// ONBOARD-03: claimStarterDeck saves the deck, sets it active, and grants the
// deck's EXACT card multiset to the collection. Stores are mocked so no real
// Firebase is touched (the live persistence round-trip is proven in 34-03's
// Playwright switcher spec).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/multiplayer/userStore.js', () => ({
  saveDeck: vi.fn(async () => ({ success: true })),
  setActiveDeckId: vi.fn(async () => ({ success: true })),
}));
vi.mock('../../src/multiplayer/collectionStore.js', () => ({
  addCardsToCollection: vi.fn(async () => ({ success: true })),
}));

// @ts-expect-error — JS module, no type declarations
import { claimStarterDeck } from '../../src/multiplayer/claimStarterDeck.js';
// @ts-expect-error — JS module, no type declarations
import { saveDeck, setActiveDeckId } from '../../src/multiplayer/userStore.js';
// @ts-expect-error — JS module, no type declarations
import { addCardsToCollection } from '../../src/multiplayer/collectionStore.js';
// @ts-expect-error — JS module, no type declarations
import { STARTER_DECKS } from '../../src/data/starterDecks.js';

const UID = 'test-uid-123';
const coertBinti = STARTER_DECKS.find(
  (d: { id: string }) => d.id === 'DUO_COERT_BINTI',
);

describe('claimStarterDeck()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(saveDeck).mockResolvedValue({ success: true });
    vi.mocked(setActiveDeckId).mockResolvedValue({ success: true });
    vi.mocked(addCardsToCollection).mockResolvedValue({ success: true });
  });

  it('saves the deck as-is under the user', async () => {
    await claimStarterDeck(UID, coertBinti);
    expect(saveDeck).toHaveBeenCalledWith(UID, coertBinti);
  });

  it('sets the claimed deck as the active deck', async () => {
    await claimStarterDeck(UID, coertBinti);
    expect(setActiveDeckId).toHaveBeenCalledWith(UID, 'DUO_COERT_BINTI');
  });

  it('grants the EXACT multiset: 19 cards with 3x piecie_kannetje_melk', async () => {
    await claimStarterDeck(UID, coertBinti);
    expect(addCardsToCollection).toHaveBeenCalledTimes(1);
    const granted: string[] = vi.mocked(addCardsToCollection).mock.calls[0][1];
    expect(granted).toHaveLength(19);
    expect(granted.filter(id => id === 'piecie_kannetje_melk')).toHaveLength(3);
  });

  it('calls saveDeck, then setActiveDeckId, then addCardsToCollection in order', async () => {
    await claimStarterDeck(UID, coertBinti);
    const saveOrder = vi.mocked(saveDeck).mock.invocationCallOrder[0];
    const activeOrder = vi.mocked(setActiveDeckId).mock.invocationCallOrder[0];
    const grantOrder = vi.mocked(addCardsToCollection).mock.invocationCallOrder[0];
    expect(saveOrder).toBeLessThan(activeOrder);
    expect(activeOrder).toBeLessThan(grantOrder);
  });

  it('returns { success: true } when all steps succeed', async () => {
    const result = await claimStarterDeck(UID, coertBinti);
    expect(result).toEqual({ success: true });
  });

  it('bails without granting cards when saveDeck fails', async () => {
    vi.mocked(saveDeck).mockResolvedValue({ success: false, error: 'nope' });
    const result = await claimStarterDeck(UID, coertBinti);
    expect(result.success).toBe(false);
    expect(setActiveDeckId).not.toHaveBeenCalled();
    expect(addCardsToCollection).not.toHaveBeenCalled();
  });

  it('fails fast on missing uid or deck', async () => {
    expect((await claimStarterDeck('', coertBinti)).success).toBe(false);
    expect((await claimStarterDeck(UID, null)).success).toBe(false);
    expect(saveDeck).not.toHaveBeenCalled();
  });
});
