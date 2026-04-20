export function U7_isCostPayment(changeSource) {
  const source = String(changeSource || "").toUpperCase();
  return source === "COST_PAYMENT" || source === "CARD_COST";
}
