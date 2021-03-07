precision mediump float;
uniform sampler2D uMainSampler;
uniform sampler2D uPaletteTexture;
varying vec2 outTexCoord;
void main(void) {
  vec4 color = texture2D(uMainSampler, outTexCoord);
  vec4 paletteColor = texture2D(uPaletteTexture, vec2(color.b, color.r));
  if (color.a == 0.0 || paletteColor.a == 0.0) {
    // Default to original color if palette color can't be found.
    gl_FragColor = color;
  } else {
    gl_FragColor = paletteColor;
  }
}