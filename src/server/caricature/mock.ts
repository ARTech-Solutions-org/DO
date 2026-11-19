import "server-only";
import sharp from "sharp";

// Fictional geometric test subject with green details, fine strands and a soft edge.
// This fixture exercises the output contract independently of any guest image.
export function mockSubjectLayer() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
    <path fill="#267754" d="M90 475q4-130 164-139 149 6 169 139z"/>
    <path fill="#eeb786" d="M214 305h82v78q-42 38-82 0z"/>
    <ellipse fill="#eeb786" cx="256" cy="240" rx="101" ry="114"/>
    <path fill="#382334" d="M151 243q-22-142 94-149 116-16 120 124-53-11-85-59-44 59-129 84z"/>
    <g fill="none" stroke="#382334" stroke-linecap="round">
      <path stroke-width="1.4" d="M177 135q-26-45-12-64m24 55q-15-53 6-68"/>
      <path opacity=".46" stroke-width="1" d="M173 140q-29-38-24-57"/>
    </g>
    <g fill="#24704c"><ellipse cx="222" cy="246" rx="9" ry="12"/><ellipse cx="297" cy="239" rx="9" ry="12"/></g>
    <path fill="none" stroke="#713d41" stroke-linecap="round" stroke-width="5" d="M229 292q30 27 65-8"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
