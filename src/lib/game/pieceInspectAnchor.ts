export function pieceInspectAnchor(element: HTMLElement): {
  anchorX: number;
  anchorY: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    anchorX: rect.left + rect.width / 2,
    anchorY: rect.top - 6,
  };
}
