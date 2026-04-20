# Buff Stacking Rules

- Buff keys are written under `flags` using the key format `buff:<buffId>`.
- Applying the same `buffId` again overwrites the previous payload.
- Unless a buff's own data contract says otherwise, duplicate buffs do not stack.
- Buff expiry is evaluated by `clearExpiredBuffs` using `expiryTurn <= current turnCount`.
