// Draws a 250x250 icon in src/thumbs/ for each self-hosted game that lacks one.
// Icons, not screenshots - one visual family so the grid reads as a set.
//   node make-thumbs.mjs
import { writeFile, access } from 'node:fs/promises';

const svg = (bg, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" width="250" height="250">\n` +
  `  <rect width="250" height="250" fill="${bg}"/>\n${body}\n</svg>\n`;

const art = {
  blockrain: svg(
    '#10131a',
    `  <g opacity=".18" stroke="#4a5262" stroke-width="1">
    <path d="M62 0V250M125 0V250M188 0V250M0 62H250M0 125H250M0 188H250"/>
  </g>
  <g>
    <rect x="66" y="24" width="55" height="55" rx="4" fill="#4dd0e1"/>
    <rect x="129" y="24" width="55" height="55" rx="4" fill="#4dd0e1"/>
    <rect x="129" y="87" width="55" height="55" rx="4" fill="#ffb74d"/>
    <rect x="3" y="150" width="55" height="55" rx="4" fill="#ef5350"/>
    <rect x="66" y="150" width="55" height="55" rx="4" fill="#ab47bc"/>
    <rect x="129" y="150" width="55" height="55" rx="4" fill="#66bb6a"/>
    <rect x="192" y="150" width="55" height="55" rx="4" fill="#ef5350"/>
    <rect x="3" y="213" width="55" height="34" rx="4" fill="#ffee58"/>
    <rect x="66" y="213" width="55" height="34" rx="4" fill="#66bb6a"/>
    <rect x="129" y="213" width="55" height="34" rx="4" fill="#4dd0e1"/>
    <rect x="192" y="213" width="55" height="34" rx="4" fill="#ab47bc"/>
  </g>`
  ),

  blockfall: svg(
    '#0e1116',
    `  <rect x="52" y="18" width="146" height="214" rx="5" fill="none" stroke="#2f3846" stroke-width="3"/>
  <g>
    <rect x="106" y="34" width="38" height="38" rx="3" fill="#7dd3fc"/>
    <rect x="106" y="72" width="38" height="38" rx="3" fill="#7dd3fc"/>
    <rect x="68" y="150" width="38" height="38" rx="3" fill="#fb923c"/>
    <rect x="106" y="150" width="38" height="38" rx="3" fill="#f472b6"/>
    <rect x="144" y="150" width="38" height="38" rx="3" fill="#a3e635"/>
    <rect x="68" y="188" width="38" height="38" rx="3" fill="#a3e635"/>
    <rect x="106" y="188" width="38" height="38" rx="3" fill="#fb923c"/>
    <rect x="144" y="188" width="38" height="38" rx="3" fill="#7dd3fc"/>
  </g>
  <g fill="#7dd3fc" opacity=".3"><rect x="110" y="116" width="30" height="4" rx="2"/></g>`
  ),

  cubecomposer: svg(
    '#171a21',
    `  <g stroke="#0f1218" stroke-width="2">
    <path d="M60 118 L92 100 L124 118 L92 136 Z" fill="#f0b429"/>
    <path d="M60 118 V152 L92 170 V136 Z" fill="#c78c14"/>
    <path d="M124 118 V152 L92 170 V136 Z" fill="#de9f1c"/>
    <path d="M60 84 L92 66 L124 84 L92 102 Z" fill="#4c9aff"/>
    <path d="M60 84 V118 L92 136 V102 Z" fill="#2f74d0"/>
    <path d="M124 84 V118 L92 136 V102 Z" fill="#3d86e8"/>
    <path d="M126 152 L158 134 L190 152 L158 170 Z" fill="#57d9a3"/>
    <path d="M126 152 V186 L158 204 V170 Z" fill="#39ab7c"/>
    <path d="M190 152 V186 L158 204 V170 Z" fill="#46c28e"/>
  </g>`
  ),

  towerdefense: svg(
    '#16281c',
    `  <path d="M0 96 H86 V60 H164 V150 H250" fill="none" stroke="#c9b48a" stroke-width="26" stroke-linecap="square"/>
  <path d="M0 96 H86 V60 H164 V150 H250" fill="none" stroke="#8f7f5f" stroke-width="2" stroke-dasharray="7 9"/>
  <g fill="#3f6b46">
    <circle cx="34" cy="176" r="16"/><circle cx="66" cy="200" r="13"/><circle cx="210" cy="52" r="15"/>
  </g>
  <g>
    <rect x="96" y="122" width="34" height="40" rx="4" fill="#5a6b7d"/>
    <rect x="96" y="112" width="34" height="14" rx="3" fill="#7c8fa3"/>
    <circle cx="113" cy="132" r="7" fill="#b8ff3c"/>
    <rect x="186" y="82" width="30" height="36" rx="4" fill="#5a6b7d"/>
    <rect x="186" y="72" width="30" height="13" rx="3" fill="#7c8fa3"/>
    <circle cx="201" cy="100" r="6" fill="#b8ff3c"/>
  </g>`
  ),

  spaceshooter: svg(
    '#0a0a1e',
    `  <g fill="#fff" opacity=".5">
    <circle cx="40" cy="52" r="1.6"/><circle cx="196" cy="40" r="1.4"/><circle cx="66" cy="206" r="1.5"/>
    <circle cx="214" cy="182" r="1.5"/><circle cx="128" cy="24" r="1.2"/>
  </g>
  <g fill="#7c4dff">
    <path d="M70 66 a16 16 0 1 1 0 .1"/><circle cx="70" cy="66" r="17"/><circle cx="180" cy="96" r="13"/>
  </g>
  <g fill="#c9a9ff" opacity=".55"><circle cx="70" cy="66" r="25"/><circle cx="180" cy="96" r="20"/></g>
  <g fill="#ffe57f"><rect x="121" y="118" width="8" height="24" rx="4"/><rect x="121" y="84" width="8" height="18" rx="4" opacity=".6"/></g>
  <g transform="translate(125 182)">
    <path d="M0 -32 L24 20 L0 8 L-24 20 Z" fill="#e3f2fd"/>
    <path d="M0 -16 L11 14 L0 8 L-11 14 Z" fill="#42a5f5"/>
  </g>`
  ),

  breakout: svg(
    '#0d1220',
    `  <g>
    <rect x="18" y="30" width="50" height="17" rx="3" fill="#ef5350"/>
    <rect x="74" y="30" width="50" height="17" rx="3" fill="#ef5350"/>
    <rect x="130" y="30" width="50" height="17" rx="3" fill="#ef5350"/>
    <rect x="186" y="30" width="46" height="17" rx="3" fill="#ef5350"/>
    <rect x="18" y="53" width="50" height="17" rx="3" fill="#ffa726"/>
    <rect x="74" y="53" width="50" height="17" rx="3" fill="#ffa726"/>
    <rect x="130" y="53" width="50" height="17" rx="3" fill="#ffa726"/>
    <rect x="186" y="53" width="46" height="17" rx="3" fill="#ffa726"/>
    <rect x="18" y="76" width="50" height="17" rx="3" fill="#66bb6a"/>
    <rect x="130" y="76" width="50" height="17" rx="3" fill="#66bb6a"/>
    <rect x="186" y="76" width="46" height="17" rx="3" fill="#66bb6a"/>
  </g>
  <path d="M96 178 L152 118" stroke="#42a5f5" stroke-width="2" stroke-dasharray="5 7" opacity=".65"/>
  <circle cx="152" cy="118" r="9" fill="#fff"/>
  <rect x="84" y="206" width="82" height="12" rx="6" fill="#42a5f5"/>`
  ),

  ballwall: svg(
    '#1b1030',
    `  <g>
    <rect x="22" y="34" width="60" height="20" rx="4" fill="#f06292"/>
    <rect x="90" y="34" width="60" height="20" rx="4" fill="#ba68c8"/>
    <rect x="158" y="34" width="70" height="20" rx="4" fill="#f06292"/>
    <rect x="22" y="62" width="60" height="20" rx="4" fill="#ba68c8"/>
    <rect x="90" y="62" width="60" height="20" rx="4" fill="#f06292"/>
    <rect x="158" y="62" width="70" height="20" rx="4" fill="#ba68c8"/>
    <rect x="56" y="90" width="60" height="20" rx="4" fill="#4dd0e1"/>
    <rect x="124" y="90" width="60" height="20" rx="4" fill="#4dd0e1"/>
  </g>
  <path d="M74 196 L138 128" stroke="#ffee58" stroke-width="2.5" stroke-dasharray="6 8" opacity=".7"/>
  <circle cx="138" cy="128" r="10" fill="#ffee58"/>
  <rect x="62" y="214" width="94" height="13" rx="6" fill="#4dd0e1"/>`
  ),

  snake: svg(
    '#0d1a12',
    `  <g opacity=".2" stroke="#2e5c3f" stroke-width="1">
    <path d="M50 0V250M100 0V250M150 0V250M200 0V250M0 50H250M0 100H250M0 150H250M0 200H250"/>
  </g>
  <g fill="#5ddb7a">
    <rect x="54" y="104" width="42" height="42" rx="8"/>
    <rect x="104" y="104" width="42" height="42" rx="8"/>
    <rect x="104" y="154" width="42" height="42" rx="8"/>
    <rect x="154" y="154" width="42" height="42" rx="8"/>
  </g>
  <rect x="154" y="104" width="42" height="42" rx="8" fill="#a5f3b4"/>
  <g fill="#0d1a12"><circle cx="167" cy="120" r="4"/><circle cx="184" cy="120" r="4"/></g>
  <circle cx="75" cy="75" r="15" fill="#ff6b6b"/>
  <rect x="72" y="56" width="5" height="9" rx="2" fill="#5ddb7a"/>`
  ),

  beatrix: svg(
    '#180d24',
    `  <g fill="#ff4d94">
    <rect x="24" y="150" width="26" height="70" rx="6"/>
    <rect x="60" y="110" width="26" height="110" rx="6"/>
  </g>
  <g fill="#ffb84d">
    <rect x="96" y="62" width="26" height="158" rx="6"/>
    <rect x="132" y="128" width="26" height="92" rx="6"/>
  </g>
  <g fill="#4dd9ff">
    <rect x="168" y="88" width="26" height="132" rx="6"/>
    <rect x="204" y="146" width="26" height="74" rx="6"/>
  </g>
  <g fill="#fff" opacity=".9">
    <circle cx="37" cy="132" r="7"/><circle cx="109" cy="44" r="7"/><circle cx="181" cy="70" r="7"/>
  </g>`
  ),

  prism: svg(
    '#07080f',
    `  <path d="M40 128 H104" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  <path d="M125 62 L182 160 H68 Z" fill="none" stroke="#8fa6c4" stroke-width="3"/>
  <g stroke-width="4" stroke-linecap="round">
    <path d="M146 128 L226 84" stroke="#ff4d4d"/>
    <path d="M146 132 L228 108" stroke="#ffa53d"/>
    <path d="M146 136 L230 132" stroke="#ffe14d"/>
    <path d="M146 140 L228 156" stroke="#5ddb7a"/>
    <path d="M146 144 L226 180" stroke="#4d9bff"/>
    <path d="M146 148 L222 202" stroke="#a24dff"/>
  </g>`
  ),

  zop: svg(
    '#101418',
    `  <g>
    <rect x="30" y="30" width="86" height="86" rx="12" fill="#233043"/>
    <rect x="134" y="30" width="86" height="86" rx="12" fill="#2f4a63"/>
    <rect x="30" y="134" width="86" height="86" rx="12" fill="#2f4a63"/>
    <rect x="134" y="134" width="86" height="86" rx="12" fill="#b8ff3c"/>
  </g>
  <g font-family="Helvetica, Arial, sans-serif" font-weight="700" text-anchor="middle" font-size="34">
    <text x="73" y="86" fill="#7b8ca1">2</text>
    <text x="177" y="86" fill="#cfe3f5">4</text>
    <text x="73" y="190" fill="#cfe3f5">4</text>
    <text x="177" y="190" fill="#152016">8</text>
  </g>`
  ),

  savetheforest: svg(
    '#0f1c14',
    `  <rect y="196" width="250" height="54" fill="#2a4a30"/>
  <g fill="#4e9a5a">
    <path d="M62 196 L62 168 L34 168 L62 118 L90 168 L62 168 Z"/>
    <path d="M40 196 L54 196 L54 168 L40 168 Z" fill="#6b4a2f"/>
    <path d="M150 196 L150 158 L118 158 L150 96 L182 158 L150 158 Z"/>
    <path d="M210 196 L210 172 L188 172 L210 132 L232 172 L210 172 Z"/>
  </g>
  <g fill="#6b4a2f">
    <rect x="56" y="168" width="12" height="30"/><rect x="144" y="158" width="13" height="40"/>
    <rect x="205" y="172" width="11" height="26"/>
  </g>
  <g fill="#4dc3ff">
    <path d="M100 34 C100 34 86 56 86 66 a14 14 0 0 0 28 0 c0-10-14-32-14-32Z"/>
    <path d="M186 48 C186 48 176 64 176 71 a10 10 0 0 0 20 0 c0-7-10-23-10-23Z" opacity=".8"/>
  </g>`
  )
};

let made = 0;
for (const [dir, body] of Object.entries(art)) {
  const file = `src/thumbs/${dir}.svg`;
  try {
    await access(file);
    console.log(`  exists  ${dir}`);
  } catch {
    await writeFile(file, body);
    console.log(`  drew    ${dir}`);
    made++;
  }
}
console.log(`\n${made} thumbnails written`);
