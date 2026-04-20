export function U1_singleTargetAttackResolution(cardActivationContext) {
  const ctx = cardActivationContext || {};
  const targetId = ctx.selectedTargetId;
  if (!targetId) {
    return { status: "invalid", reason: "missing_target" };
  }

  if (ctx.targetStillValid === false) {
    return {
      status: "fizzled",
      targetId,
      redirectAllowed: false,
    };
  }

  return {
    status: "resolve",
    targetId,
    redirectAllowed: false,
  };
}
