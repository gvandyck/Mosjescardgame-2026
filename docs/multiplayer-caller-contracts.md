# Multiplayer Caller Contracts

These are engine requirements that must be fulfilled by the UI/room-manager layer.

## Frenssen targetRef (resolved in engine)
When invoking Frenssen as a response to a pending effect, the engine now auto-resolves
`invocation.targetRef` from `pendingEffect.source.playerId` and the target player's active Mosje.
The caller no longer needs to manually set `targetRef` for this path.

## Remaining contracts
No additional caller contracts are currently required for Step 0.
