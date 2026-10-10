// canPay.js — true only when the player can pay a valid Energy amount. Pure.
export function canPay(player, amount) {
  return Number.isInteger(amount)
    && amount >= 0
    && Number.isInteger(player?.energy)
    && player.energy >= amount;
}
