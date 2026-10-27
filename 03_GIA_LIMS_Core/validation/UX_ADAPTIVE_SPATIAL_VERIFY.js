const fs=require('fs');
const s=fs.readFileSync('public/index.html','utf8');
const checks=[
 ['AI orb', /id='giaOrb'/],
 ['voice recognition', /SpeechRecognition/],
 ['authenticated AI command API', /\/api\/ai\/voice-command/],
 ['adaptive responsive state', /giaUpdateAdaptive/],
 ['calm motion reduced-motion', /prefers-reduced-motion/],
 ['meaningful motion', /giaBreath|giaWave/],
 ['spatial 3D CSS', /perspective:1400px/],
 ['spatial canvas', /giaSpatialCanvas/],
 ['WebXR capability detection', /navigator\.xr\.isSessionSupported/],
 ['WebXR immersive session', /requestSession\('immersive-vr'/],
 ['XR graceful fallback', /WEBXR UNAVAILABLE/],
 ['keyboard command palette', /Ctrl\/⌘\+K command palette|ctrlKey.*metaKey/],
 ['F2 voice shortcut', /e\.key==='F2'/],
 ['spatial reset', /giaSpatialReset/],
 ['no React dependency', !/from ['"]react['"]|require\(['"]react['"]\)/.test(s)],
 ['no Three.js dependency', !/three\.js|from ['"]three['"]|require\(['"]three['"]\)/i.test(s)],
 ['no localStorage clinical state', !/localStorage/.test(s)],
 ['ARIA voice status', /aria-live/],
 ['24-module catalog preserved', /const MODULES=\[([\s\S]*?)\];/.test(s) && (s.match(/id:'/g)||[]).length>=24],
 ['spatial module exposed', /views\.spatial=async/]
];
let n=0;for(const [name,re] of checks){const ok=typeof re==='boolean'?re:re.test(s);if(!ok)throw new Error('FAIL '+name);console.log('PASS '+name);n++}
console.log(`UX_ADAPTIVE_SPATIAL_VERIFY PASS / ${n}`)
