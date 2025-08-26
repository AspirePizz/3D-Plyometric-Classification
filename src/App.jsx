import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Plyometric Explorer – Sphere Edition (V3)
 * Aspire look: deep navy, slate, subtle glass, green accent
 * Interactions:
 *  - Rotating, reflective sphere with glowing pins for each combination
 *  - Click a pin -> filters the drill list
 *  - Toggle Z-axis: Structure ↔ Load (pins shift radius slightly)
 */

const CONTACT = ["Spring (Short)", "Shock (Long)"]; // X
const DIRECTION = ["Vertical", "Lateral", "Horizontal"]; // Y
const STRUCTURE = ["Bilateral", "Unilateral"];          // Z option A
const LOAD = ["BW", "Assisted", "Banded", "Loaded"];    // Z option B
const INTENSITY = ["Extensive", "Intensive"];
const TISSUE = ["Tendon", "Muscle", "Mixed"];

const EXERCISES_RAW = [
  ["Pogo Jumps","Spring (Short)","Vertical","BW","Bilateral","Extensive","Tendon","Stiffness + ankle tendon behavior"],
  ["Skater Hop-to-Stick","Shock (Long)","Lateral","BW","Unilateral","Intensive","Muscle","Lateral impulse control (hockey)"],
  ["Weighted CMJ","Shock (Long)","Vertical","Loaded","Bilateral","Intensive","Muscle","Max vertical impulse"],
  ["Continuous Bounds","Spring (Short)","Lateral","BW","Unilateral","Extensive","Tendon","Rhythm + skate timing"],
  ["Overspeed Broad Jumps","Spring (Short)","Horizontal","Assisted","Bilateral","Extensive","Tendon","Horizontal speed-overload"],
  ["Band-Resisted Lateral Hop","Shock (Long)","Lateral","Loaded","Unilateral","Intensive","Muscle","Stride mimic (resisted)"],
  ["Assisted Hurdle Hops","Spring (Short)","Vertical","Assisted","Bilateral","Extensive","Tendon","Overspeed rebound vertical"],
  ["Weighted Broad Jump","Shock (Long)","Horizontal","Loaded","Bilateral","Intensive","Muscle","Acceleration development"],
  ["Band-Resisted Skater Hop","Shock (Long)","Lateral","Loaded","Unilateral","Intensive","Muscle","Reacceleration + stick"],
  ["Depth Drop to Stick","Shock (Long)","Vertical","BW","Bilateral","Intensive","Mixed","Braking + posture"],
  ["Alt Split Pogo","Spring (Short)","Vertical","BW","Unilateral","Extensive","Tendon","Coordination and foot rhythm"],
  ["Lateral Line Hops","Spring (Short)","Lateral","BW","Bilateral","Extensive","Tendon","Extensive lateral patterning"],
  ["Banded Ankle Hops","Spring (Short)","Vertical","Banded","Bilateral","Extensive","Tendon","Stiffness + ankle coordination"],
  ["Single-Leg Lateral Hop & Stick","Shock (Long)","Lateral","BW","Unilateral","Intensive","Muscle","Impulse control + landing"],
  ["Depth Jump → Hurdle","Spring (Short)","Vertical","BW","Bilateral","Intensive","Mixed","Landing → reactive vertical"],
  ["MB Vertical Toss","Shock (Long)","Vertical","Loaded","Bilateral","Intensive","Muscle","Full-body vertical projection"],
  ["Band-Assisted Tuck Jumps","Spring (Short)","Vertical","Assisted","Bilateral","Extensive","Tendon","Reactive speed-overload"],
  ["Single-Leg Hurdle Hops","Spring (Short)","Vertical","BW","Unilateral","Extensive","Tendon","Reactive vertical (SL)"],
  ["Continuous Broad Jumps","Shock (Long)","Horizontal","BW","Bilateral","Intensive","Muscle","Horizontal impulse and rhythm"],
  ["Depth Drop → Skater Hop","Shock (Long)","Lateral","Loaded","Unilateral","Intensive","Muscle","Brake → lateral impulse"],
  ["Box Jump","Shock (Long)","Vertical","BW","Bilateral","Intensive","Muscle","Landing strategy for vertical force"],
  ["Countermovement Jump","Shock (Long)","Vertical","BW","Bilateral","Intensive","Muscle","Bilateral concentric power"],
  ["Single-Leg Box Jump","Shock (Long)","Vertical","BW","Unilateral","Intensive","Muscle","SL vertical coordination + decel"],
  ["Reactive Skater Bound","Spring (Short)","Lateral","BW","Unilateral","Extensive","Tendon","Elastic crossover rhythm"],
  ["Forward Lunge → Vertical Jump","Shock (Long)","Vertical","BW","Unilateral","Intensive","Muscle","Transitional vertical coordination"],
  ["Depth Jump to Stick","Spring (Short)","Vertical","BW","Bilateral","Intensive","Mixed","Eccentric landing + stiffness"],
  ["Hurdle Hops","Spring (Short)","Vertical","BW","Bilateral","Extensive","Tendon","Vertical rhythm and ankle control"],
  ["SL Depth Drop → Skater","Shock (Long)","Lateral","BW","Unilateral","Intensive","Muscle","Control lateral braking impulse"],
  ["Tuck Jumps","Spring (Short)","Vertical","BW","Bilateral","Extensive","Tendon","Elastic vertical quickness"],
  ["MB Scoop Toss (Forward)","Shock (Long)","Horizontal","Loaded","Bilateral","Intensive","Muscle","Horizontal projection"],
  ["Lateral Box Step-off → Hop","Shock (Long)","Lateral","BW","Unilateral","Intensive","Muscle","Lateral decel with rebound"],
  ["Band-Resisted Pogo","Spring (Short)","Vertical","Banded","Bilateral","Extensive","Tendon","Ankle stiffness and tendon load"],
  ["Crossover Bound → Stick","Shock (Long)","Lateral","BW","Unilateral","Intensive","Muscle","Frontal plane reactive power"],
  ["Double Broad Jump","Shock (Long)","Horizontal","BW","Bilateral","Intensive","Muscle","Multiple horizontal steps"],
  ["Low Hurdle Mini Hops","Spring (Short)","Vertical","BW","Bilateral","Extensive","Tendon","Elastic rhythm training"],
  ["Step-Up Jump","Shock (Long)","Vertical","Loaded","Unilateral","Intensive","Muscle","Unilateral vertical projection"],
  ["Assisted Single-Leg Hops","Spring (Short)","Lateral","Assisted","Unilateral","Extensive","Tendon","Assisted reactivity + rhythm"],
  ["Banded Skater Reactive Hop","Spring (Short)","Lateral","Banded","Unilateral","Intensive","Muscle","Reactive strength in lateral stride"],
  ["Reactive Drop Jump","Spring (Short)","Vertical","BW","Bilateral","Extensive","Tendon","Improve bounce and stiffness"],
  ["Split Squat Jump","Spring (Short)","Vertical","BW","Bilateral","Extensive","Tendon","Quick double-leg switch in air"],
  ["MB Slam + Vertical Jump","Shock (Long)","Vertical","Loaded","Bilateral","Intensive","Muscle","Power + projection"],
  ["Banded Lateral Quick Hops","Spring (Short)","Lateral","Banded","Bilateral","Extensive","Tendon","Fast-twitch lateral stiffness"],
  ["Alternating Lunge Jumps","Spring (Short)","Vertical","BW","Unilateral","Extensive","Tendon","Split-leg stiffness coordination"],
  ["Broad Jump → Stick","Shock (Long)","Horizontal","BW","Bilateral","Intensive","Muscle","Stick landing post horizontal impulse"],
  ["Lateral Bound Repeats","Spring (Short)","Lateral","BW","Unilateral","Extensive","Tendon","Frontal plane reactive bounding"],
  ["Overhead MB Back Toss","Shock (Long)","Horizontal","Loaded","Bilateral","Intensive","Muscle","Explosive horizontal projection"],
  ["Low Box Hop-Down → Stick","Shock (Long)","Vertical","BW","Bilateral","Mixed","Landing posture control"],
  ["Depth Drop → Broad Jump","Shock (Long)","Horizontal","Loaded","Bilateral","Intensive","Muscle","Triple extension landing control"],
  ["Single-Leg Mini Hops","Spring (Short)","Vertical","BW","Unilateral","Extensive","Tendon","Rhythmic stiffness SL coordination"],
  ["Rotational Skater Hop","Shock (Long)","Lateral","BW","Unilateral","Intensive","Muscle","Rotational impulse (hockey)"],
  ["Seated Jump","Shock (Long)","Vertical","Loaded","Bilateral","Intensive","Muscle","Concentric bias from seated"],
  ["Skater Hop – Continuous","Spring (Short)","Lateral","BW","Unilateral","Extensive","Tendon","Continuous rhythm skater hops"],
];

const EX = EXERCISES_RAW.map(([name, contact, dir, load, struct, intensity, tissue, notes]) => ({
  name, contact, dir, load, struct, intensity, tissue, notes,
}));

// Aesthetic helpers (Aspire-ish palette)
const COLORS = {
  bg: "#0b1220",        // deep navy
  panel: "#0f172a",     // slate/ink
  text: "#e2e8f0",      // slate-100
  sub: "#94a3b8",       // slate-400
  accent: "#22c55e",    // green
  vertical: "#60a5fa",  // blue
  lateral: "#f59e0b",   // amber
  horizontal: "#f97316" // orange
};
const dirColor = (dir) => dir === "Vertical" ? COLORS.vertical : dir === "Lateral" ? COLORS.horizontal : COLORS.lateral;

// Map indices to spherical coordinates
// contact: -40° (Spring) … +40° (Shock) as longitude
// direction: +40° (Vertical), 0° (Lateral), -40° (Horizontal) as latitude
function toRadians(d) { return (d * Math.PI) / 180; }
function pinPosition(contact, direction, zAxis, zValue) {
  const lon = contact === "Spring (Short)" ? -40 : +40; // X -> longitude
  const lat = direction === "Vertical" ? +40 : direction === "Lateral" ? 0 : -40; // Y -> latitude
  // Radius: base = 1; nudge by Z (Structure or Load)
  let r = 1.0;
  if (zAxis === "Structure") {
    r += (zValue === "Unilateral" ? 0.08 : -0.02);
  } else {
    const rank = { BW: 0, Assisted: 1, Banded: 2, Loaded: 3 }[zValue] ?? 0;
    r += (rank * 0.035) - 0.03;
  }
  const phi = toRadians(90 - lat);     // polar
  const theta = toRadians(lon);        // azimuth
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
}

function Pins({ zAxis, onSelect, selectedKey }) {
  const pins = [];
  const zValues = zAxis === "Structure" ? STRUCTURE : LOAD;
  for (const c of CONTACT) {
    for (const d of DIRECTION) {
      for (const z of zValues) {
        const key = `${c}|${d}|${zAxis}:${z}`;
        const pos = pinPosition(c, d, zAxis, z);
        const active = selectedKey === key;
        pins.push(
          <Pin key={key} position={pos} color={dirColor(d)} active={active} onClick={() => onSelect(key)} label={`${c} • ${d} • ${zAxis}:${z}`} />
        );
      }
    }
  }
  return <group>{pins}</group>;
}

function Pin({ position, color, active, onClick, label }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <group position={position} onClick={onClick}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.035 * (active ? 1.6 : 1.0), 16, 16]} />
        <meshStandardMaterial emissive={color} emissiveIntensity={active ? 2.0 : 1.0} color={color} metalness={0.3} roughness={0.25} />
      </mesh>
      {/* tiny label always facing camera */}
      <Html center distanceFactor={10}>
        <div style={{
          background: active ? "rgba(34,197,94,.14)" : "rgba(15,23,42,.35)",
          border: `1px solid ${active ? COLORS.accent : "rgba(148,163,184,.35)"}`,
          color: COLORS.text, fontSize: 10, padding: "3px 6px", borderRadius: 8, whiteSpace: "nowrap"
        }}>
          {label}
        </div>
      </Html>
    </group>
  );
}

function useFiltered(exList, selectedKey, tagFilters, zAxis) {
  return useMemo(() => {
    let contact=null, dir=null, zKey=null, zVal=null;
    if (selectedKey) { const [c, d, z] = selectedKey.split("|"); contact=c; dir=d; [zKey, zVal]=z.split(":"); }
    return exList.filter((e) => {
      const base = (!contact || e.contact===contact) && (!dir || e.dir===dir) && (!zVal || (zKey==="Structure" ? e.struct===zVal : e.load===zVal));
      if (!base) return false;
      const { load, intensity, tissue } = tagFilters;
      const okLoad = load.size ? load.has(e.load) : true;
      const okInt  = intensity.size ? intensity.has(e.intensity) : true;
      const okTis  = tissue.size ? tissue.has(e.tissue) : true;
      return okLoad && okInt && okTis;
    });
  }, [exList, selectedKey, tagFilters, zAxis]);
}

export default function App() {
  const [zAxis, setZAxis] = useState("Structure");
  const [selected, setSelected] = useState(null);
  const [loadSel, setLoadSel] = useState(new Set());
  const [intSel, setIntSel] = useState(new Set());
  const [tisSel, setTisSel] = useState(new Set());
  const filtered = useFiltered(EX, selected, { load: loadSel, intensity: intSel, tissue: tisSel }, zAxis);

  const toggle = (setFn, v) => setFn(prev => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; });

  return (
    <div style={{display:"grid", gridTemplateColumns:"1.1fr 0.9fr", height:"100vh", background: `radial-gradient(1200px 800px at 20% 20%, #0b1a30 0%, ${COLORS.bg} 60%)`}}>
      {/* LEFT: 3D Scene */}
      <div style={{position:"relative", borderRight:"1px solid rgba(148,163,184,.15)"}}>
        <Canvas camera={{ position:[0, 0.9, 2.2], fov: 45 }}>
          <color attach="background" args={[COLORS.bg]} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 2, 2]} intensity={1.1} />
          <directionalLight position={[-3, -2, -1]} intensity={0.4} />

          {/* glossy sphere */}
          <SpinningSphere />

          {/* pins */}
          <Pins zAxis={zAxis} onSelect={setSelected} selectedKey={selected} />

          <OrbitControls enablePan={false} enableZoom={false} />
        </Canvas>

        {/* top-left label */}
        <div style={{position:"absolute", top:12, left:12, padding:"10px 12px", borderRadius:12,
          background:"rgba(15,23,42,.6)", border:"1px solid rgba(148,163,184,.25)", color:COLORS.text}}>
          <div style={{fontWeight:600}}>Plyometric Performance Sphere</div>
          <div style={{fontSize:12, color:COLORS.sub}}>Click a glowing pin to filter drills</div>
        </div>

        {/* top-right Z axis toggle */}
        <div style={{position:"absolute", top:12, right:12, padding:"8px 10px", borderRadius:12,
          background:"rgba(15,23,42,.6)", border:"1px solid rgba(148,163,184,.25)", display:"flex", gap:8, alignItems:"center", color:COLORS.sub}}>
          <span style={{fontSize:12}}>Z-Axis:</span>
          {["Structure","Load"].map(v => (
            <button key={v}
              onClick={() => { setSelected(null); setZAxis(v); }}
              style={{
                padding:"6px 10px", borderRadius:8, border:`1px solid ${v===zAxis ? COLORS.accent : "rgba(148,163,184,.35)"}`,
                background: v===zAxis ? "rgba(34,197,94,.15)" : "rgba(15,23,42,.4)", color: COLORS.text
              }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Explorer Panel */}
      <div style={{padding:16, overflowY:"auto", background:`linear-gradient(180deg, rgba(15,23,42,.92), rgba(11,18,32,.95))`}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
          <div style={{fontSize:20, fontWeight:600, color:COLORS.text}}>Explorer Panel</div>
          <button
            onClick={() => { setSelected(null); setLoadSel(new Set()); setIntSel(new Set()); setTisSel(new Set()); }}
            style={{padding:"6px 10px", borderRadius:8, background:COLORS.panel, border:`1px solid rgba(148,163,184,.25)`, color:COLORS.text}}>
            Clear
          </button>
        </div>

        <Panel>
          <Muted>Current Selection</Muted>
          <div style={{color:COLORS.text}}>
            {selected ? selected.replace("|"," • ").replace("|"," • ") : "None (click a pin on the sphere)"}
          </div>
        </Panel>

        <Panel>
          <Muted>Refine by Tags</Muted>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12}}>
            <TagGroup label="Load" values={LOAD} selected={loadSel} onToggle={(v)=>toggle(setLoadSel, v)} />
            <TagGroup label="Intensity" values={INTENSITY} selected={intSel} onToggle={(v)=>toggle(setIntSel, v)} />
            <TagGroup label="Target Tissue" values={TISSUE} selected={tisSel} onToggle={(v)=>toggle(setTisSel, v)} />
          </div>
        </Panel>

        <div style={{border:"1px solid rgba(148,163,184,.25)", borderRadius:12, overflow:"hidden", background:"rgba(11,18,32,.45)"}}>
          <div style={{padding:12, borderBottom:"1px solid rgba(148,163,184,.25)"}}>
            <Muted>Matching Exercises ({filtered.length})</Muted>
          </div>
          <div>
            <AnimatePresence>
              {filtered.map((e) => (
                <motion.div key={e.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  style={{padding:12, borderBottom:"1px solid rgba(148,163,184,.15)"}}>
                  <div style={{fontWeight:600, color:COLORS.text}}>{e.name}</div>
                  <div style={{fontSize:12, color:COLORS.sub, marginTop:2}}>{e.contact} • {e.dir} • {e.struct} • {e.load}</div>
                  <div style={{fontSize:12, color:COLORS.sub}}>{e.intensity} • {e.tissue}</div>
                  <div style={{marginTop:6, color:COLORS.text}}>{e.notes}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div style={{padding:24, textAlign:"center", color:COLORS.sub}}>No matches — click a pin and/or loosen tag filters.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// glossy animated sphere
function SpinningSphere() {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.25; });
  return (
    <group ref={ref}>
      <Sphere args={[1, 64, 64]}>
        <meshPhysicalMaterial
          color={"#0c1b33"}
          metalness={0.3}
          roughness={0.2}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          reflectivity={0.9}
          transmission={0.0}
          envMapIntensity={1.0}
        />
      </Sphere>
      {/* faint inner glow */}
      <Sphere args={[1.005, 32, 32]}>
        <meshBasicMaterial color={"#22c55e"} transparent opacity={0.06} />
      </Sphere>
    </group>
  );
}

function Panel({ children }) {
  return (
    <div style={{border:"1px solid rgba(148,163,184,.25)", borderRadius:12, padding:12, marginBottom:12, background:"rgba(11,18,32,.45)"}}>
      {children}
    </div>
  );
}

function Muted({ children }) {
  return <div style={{fontSize:12, letterSpacing:".06em", textTransform:"uppercase", color:"#94a3b8", marginBottom:6}}>{children}</div>;
}

function TagGroup({ label, values, selected, onToggle }) {
  return (
    <div>
      <div style={{fontSize:12, color:"#94a3b8", marginBottom:6, fontWeight:600}}>{label}</div>
      <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
        {values.map(v => {
          const on = selected.has(v);
          return (
            <button key={v}
              onClick={() => onToggle(v)}
              style={{
                padding:"6px 10px", borderRadius:8,
                border:`1px solid ${on ? "#22c55e" : "rgba(148,163,184,.35)"}`,
                background: on ? "rgba(34,197,94,.15)" : "rgba(15,23,42,.4)",
                color:"#e2e8f0"
              }}>
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}
