/** Shared bottom stack heights for prep dock + bench positioning (rem). */
export const BOTTOM_SHOP_HEIGHT_REM = 10.5;
export const BOTTOM_LETTER_STRIP_REM = 3;
export const BOTTOM_LETTER_EXPANDED_EXTRA_REM = 5.75;
export const BOTTOM_STACK_GAP_REM = 0.375;

export function benchBottomRem(prepShopVisible: boolean, letterExpanded: boolean): number {
  const letter = BOTTOM_LETTER_STRIP_REM + (letterExpanded ? BOTTOM_LETTER_EXPANDED_EXTRA_REM : 0);
  const shop = prepShopVisible ? BOTTOM_SHOP_HEIGHT_REM + BOTTOM_STACK_GAP_REM : 0;
  return letter + shop + BOTTOM_STACK_GAP_REM + 0.5;
}
