precision mediump float;
uniform sampler2D uMainSampler;
uniform sampler2D uPaletteTexture;

varying vec2 outTexCoord;
varying float outTintEffect;
varying vec4 outTint;
void main(void) {
  vec4 textureColor = texture2D(uMainSampler, outTexCoord);
  vec4 paletteColor = texture2D(uPaletteTexture, vec2(textureColor.b, textureColor.r));
  if (textureColor.a == 0.0 || paletteColor.a == 0.0) {
    // Default to original color if palette color can't be found.
    paletteColor = textureColor;
  }

  vec4 texel = vec4(outTint.bgr * outTint.a, outTint.a);

  //  Multiply texture tint
  vec4 color = paletteColor * texel;

  if (outTintEffect == 1.0)
  {
    //  Solid color + texture alpha
    color.rgb = mix(paletteColor.rgb, outTint.bgr * outTint.a, paletteColor.a);
  }
  else if (outTintEffect == 2.0)
  {
    //  Solid color, no texture
    color = texel;
  }

  gl_FragColor = color;
}