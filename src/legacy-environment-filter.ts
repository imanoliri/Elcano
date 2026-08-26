// Temporary compatibility shim while the legacy environment renderer still
// lives in main.ts. It suppresses only the two obsolete coarse vector strokes
// on the main ocean canvas. The high-resolution overlay uses different styles.
const originalStroke = CanvasRenderingContext2D.prototype.stroke;

CanvasRenderingContext2D.prototype.stroke = function (path?: Path2D): void {
  const canvas = this.canvas;
  const style = String(this.strokeStyle).replaceAll(' ', '');
  const obsoleteWind = style === 'rgba(255,255,255,0.34)' || style === 'rgba(255,255,255,.34)';
  const obsoleteCurrent = style === 'rgba(74,213,255,0.75)' || style === 'rgba(74,213,255,.75)';

  if (canvas.id === 'ocean' && (obsoleteWind || obsoleteCurrent)) return;
  Reflect.apply(originalStroke, this, path ? [path] : []);
};
