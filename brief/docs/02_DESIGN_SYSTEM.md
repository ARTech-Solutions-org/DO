# Visual Direction & Brand Fidelity

## Direction: premium nightlife / party, not futuristic AI demo
Think dark club editorial, real concert spotlights, tasteful grain, physical chrome, glitter/disco motifs, stage-light washes, punchy condensed event typography, clean photography cutouts. Avoid overdecorating every screen, plastic 3D gradients, neon outlines on everything, crowded panels, and unlicensed celebrity portraits.

## Brand sources, do not silently reconcile
- **ONE DEVELOPMENT CI (July 2024), source PDF:** primary white `#FFFFFF`, purple `#966BFC`, cyan `#2EC4FF`; secondary grey `#D9E1E2`, green `#55D893`, black `#000000`. Brand says do not let secondary dominate; purple-over-white or white-over-purple logo preferred, fallback black/white; no shadow, gradient, outline, distortion of logo. English brand typography Sharp Sans Display No2 Bold for headlines / Medium for paragraph. See official manual pages 16–17, 24–26, 28.
- **DO Hotels (April 2025), source PDF:** primary BLACK/WHITE, accent palette has warm orange `RGB 228 141 61` (`#E48D3D`), red-orange `RGB 202 93 54` (`#CA5D36`), pale orange `#E8A440`, cool teal variants etc. English typeface Alexandria family; Arabic DIN Next LT Arabic. It forbids recreating brand logos and requests logo clear space. Sunset/drama/music visual direction. See pages 8, 10–15.
- **Client voice:** ONE primarily purple, DO may be black or orange, purple+orange and black are permitted combinations. This is a *client aesthetic request*, not an override to recolor official logos arbitrarily.
- **Invitation:** source footage includes luminous chrome spherical/disco/groove motifs and moody violet metallic lighting; use only as art direction, not direct UI raster.

## Proposed event UI token values (NOT official brand colors)
```
--ui-bg: #0B0911;
--ui-surface: #16121F;
--one-purple: #966BFC;
--do-orange: #E48D3D;
--ui-foreground: #FFFFFF;
--ui-muted: #D6CFDF;
--ui-chrome: #D4D0D9;
--ui-overlay: rgba(6, 4, 12, 0.48);
```
Use purple selectively as a dominant event light and key accent against black, not a big cheap-looking gradient on every view. Ensure readable contrast with overlays. Orange used for special highlights, optional alternate accent; never recolor an official brand logo unless permitted variation.

## Typography
- Primary brand fonts are license-dependent: DO `Alexandria`, ONE `Sharp Sans Display No2`; use licensed actual font files ONLY when provided by client.
- For generic party display headlines, pick a legally embeddable condensed display font consistent with event direction (e.g. `Barlow Condensed` or `Archivo Black`), not imitating proprietary brand wordmarks. Use the official brand font for branded text as allowed.
- Strong typographic hierarchy: headline ~88–148 design pixels at 1080-wide scale, label/button ~22–34 design px; keep text as live DOM, never baked into AI artwork.
- Avoid more than ~5–7 words of major text on a screen (tiny consent exception).

## Layout & motion
- 1080×1920 reference frame; intentionally art-directed 9:16 composition, full-bleed background, top safe brand area, center stage content, bottom action zone; responsive scaling; no stretching screenshots.
- Lighting/background via layered static textures with subtle CSS transforms, only use WebGL for one meaningful effect if absolutely needed (disco ball). Favor CSS/SVG + GSAP.
- Specific beats: Welcome reveal 0.8–1.2s, style card 0.35s, countdown one beat per number, result photo 0.7s. Honor `prefers-reduced-motion`.
- Background art image separate from logo/headline/button; never use a full mocked-up screen as a production background.
- Photo export layout must be generated from original output + brand frame at source resolution; no camera screenshot or screen capture.

## Brand asset handling
- Use provided PDF brand guides as truth. Request original vector logos and official font licenses. Existing cutout PNGs are **inspection aids** only; don't present re-rasterized/reference artifacts as final licensed production lockups.
