import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Plyometric Explorer – Interactive 3D Model (V2)
 * Aspire Health & Performance
 *
 * ➤ NEW in V2
 * 1) Axis tuner: choose which variable lives on the Z‑axis (Structure or Load).
 * 2) Full 50+ exercise library wired in (mirrors your Airtable schema).
 * 3) Cleaner UI, clearer labels, and a Details panel.
 *
 * Axes (default)
 *  X (left → right): Contact Time = Spring (short) → Shock (long)
 *  Y (front → back): Direction = Vertical → Lateral → Horizontal
 *  Z (down → up): Structure (Bilateral → Unilateral)  ⟵ switchable to Load
 */

// --- Controlled vocab ---
const CONTACT = ["Spring (Short)", "Shock (Long)"]; // X: 0..1
const DIRECTION = ["Vertical", "Lateral", "Horizontal"]; // Y: 0..2
const STRUCTURE = ["Bilateral", "Unilateral"]; // Z option A
const LOAD = ["BW", "Assisted", "Banded", "Loaded"]; // Z option B or tag filter
const INTENSITY = ["Extensive", "Intensive"]; // tag filter
const TISSUE = ["Tendon", "Muscle", "Mixed"]; // tag filter

// --- Exercise library (51 entries)
// name, contact, dir, load, struct, intensity, tissue, notes
const EXERCISES_RAW = [
  ["Pogo Jumps", "Spring (Short)", "Vertical", "BW", "Bilateral", "Extensive", "Tendon", "Stiffness + ankle tendon behavior"],
  ["Skater Hop‑to‑Stick", "Shock (Long)", "Lateral", "BW", "Unilateral", "Intensive", "Muscle", "Lateral impulse control (hockey)"],
  ["Weighted CMJ", "Shock (Long)", "Vertical", "Loaded", "Bilateral", "Intensive", "Muscle", "Max vertical impulse"],
  ["Continuous Bounds", "Spring (Short)", "Lateral", "BW", "Unilateral", "Extensive", "Tendon", "Rhythm + skate timing"],
  ["Overspeed Broad Jumps", "Spring (Short)", "Horizontal", "Assisted", "Bilateral", "Extensive", "Tendon", "Horizontal speed‑overload"],
  ["Band‑Resisted Lateral Hop", "Shock (Long)", "Lateral", "Loaded", "Unilateral", "Intensive", "Muscle", "Stride mimic (resisted)"],
  ["Assisted Hurdle Hops", "Spring (Short)", "Vertical", "Assisted", "Bilateral", "Extensive", "Tendon", "Overspeed rebound vertical"],
  ["Weighted Broad Jump", "Shock (Long)", "Horizontal", "Loaded", "Bilateral", "Intensive", "Muscle", "Acceleration development"],
  ["Band‑Resisted Skater Hop", "Shock (Long)", "Lateral", "Loaded", "Unilateral", "Intensive", "Muscle", "Reacceleration + stick"],
  ["Depth Drop to Stick", "Shock (Long)", "Vertical", "BW", "Bilateral", "Intensive", "Mixed", "Braking + posture"],
  ["Alt Split Pogo", "Spring (Short)", "Vertical", "BW", "Unilateral", "Extensive", "Tendon", "Coordination and foot rhythm"],
  ["Lateral Line Hops", "Spring (Short)", "Lateral", "BW", "Bilateral", "Extensive", "Tendon", "Extensive lateral patterning"],
  ["Banded Ankle Hops", "Spring (Short)", "Vertical", "Banded", "Bilateral", "Extensive", "Tendon", "Stiffness + ankle coordination"],
  ["Single‑Leg Lateral Hop & Stick", "Shock (Long)", "Lateral", "BW", "Unilateral", "Intensive", "Muscle", "Impulse control + landing"],
  ["Depth Jump → Hurdle", "Spring (Short)", "Vertical", "BW", "Bilateral", "Intensive", "Mixed", "Landing → reactive vertical"],
  ["MB Vertical Toss", "Shock (Long)", "Vertical", "Loaded", "Bilateral", "Intensive", "Muscle", "Full‑body vertical projection"],
  ["Band‑Assisted Tuck Jumps", "Spring (Short)", "Vertical", "Assisted", "Bilateral", "Extensive", "Tendon", "Reactive speed‑overload"],
  ["Single‑Leg Hurdle Hops", "Spring (Short)", "Vertical", "BW", "Unilateral", "Extensive", "Tendon", "Reactive vertical (SL)"],
  ["Continuous Broad Jumps", "Shock (Long)", "Horizontal", "BW", "Bilateral", "Intensive", "Muscle", "Horizontal impulse and rhythm"],
  ["Depth Drop → Skater Hop", "Shock (Long)", "Lateral", "Loaded", "Unilateral", "Intensive", "Muscle", "Brake → lateral impulse"],
  ["Box Jump", "Shock (Long)", "Vertical", "BW", "Bilateral", "Intensive", "Muscle", "Landing strategy for vertical force"],
  ["Countermovement Jump", "Shock (Long)", "Vertical", "BW", "Bilateral", "Intensive", "Muscle", "Bilateral concentric power"],
  ["Single‑Leg Box Jump", "Shock (Long)", "Vertical", "BW", "Unilateral", "Intensive", "Muscle", "SL vertical coordination + decel"],
  ["Reactive Skater Bound", "Spring (Short)", "Lateral", "BW", "Unilateral", "Extensive", "Tendon", "Elastic crossover rhythm"],
  ["Forward Lunge → Vertical Jump", "Shock (Long)", "Vertical", "BW", "Unilateral", "Intensive", "Muscle", "Transitional vertical coordination"],
  ["Depth Jump to Stick", "Spring (Short)", "Vertical", "BW", "Bilateral", "Intensive", "Mixed", "Eccentric landing + stiffness"],
  ["Hurdle Hops", "Spring (Short)", "Vertical", "BW", "Bilateral", "Extensive", "Tendon", "Vertical rhythm and ankle control"],
  ["SL Depth Drop → Skater", "Shock (Long)", "Lateral", "BW", "Unilateral", "Intensive", "Muscle", "Control lateral braking impulse"],
  ["Tuck Jumps", "Spring (Short)", "Vertical", "BW", "Bilateral", "Extensive", "Tendon", "Elastic vertical quickness"],
  ["MB Scoop Toss (Forward)", "Shock (Long)", "Horizontal", "Loaded", "Bilateral", "Intensive", "Muscle", "Horizontal projection"],
  ["Lateral Box Step‑off → Hop", "Shock (Long)", "Lateral", "BW", "Unilateral", "Intensive", "Muscle", "Lateral decel with rebound"],
  ["Band‑Resisted Pogo", "Spring (Short)", "Vertical", "Banded", "Bilateral", "Extensive", "Tendon", "Ankle stiffness and tendon load"],
  ["Crossover Bound → Stick", "Shock (Long)", "Lateral", "BW", "Unilateral", "Intensive", "Muscle", "Frontal plane reactive power"],
  ["Double Broad Jump", "Shock (Long)", "Horizontal", "BW", "Bilateral", "Intensive", "Muscle", "Multiple horizontal steps"],
  ["Low Hurdle Mini Hops", "Spring (Short)", "Vertical", "BW", "Bilateral", "Extensive", "Tendon", "Elastic rhythm training"],
  ["Step‑Up Jump", "Shock (Long)", "Vertical", "Loaded", "Unilateral", "Intensive", "Muscle", "Unilateral vertical projection"],
  ["Assisted Single‑Leg Hops", "Spring (Short)", "Lateral", "Assisted", "Unilateral", "Extensive", "Tendon", "Assisted reactivity + rhythm"],
  ["Banded Skater Reactive Hop", "Spring (Short)", "Lateral", "Banded", "Unilateral", "Intensive", "Muscle", "Reactive strength in lateral stride"],
  ["Reactive Drop Jump", "Spring (Short)", "Vertical", "BW", "Bilateral", "Extensive", "Tendon", "Improve bounce and stiffness"],
  ["Split Squat Jump", "Spring (Short)", "Vertical", "BW", "Bilateral", "Extensive", "Tendon", "Quick double‑leg switch in air"],
  ["MB Slam + Vertical Jump", "Shock (Long)", "Vertical", "Loaded", "Bilateral", "Intensive", "Muscle", "Power + projection"],
  ["Banded Lateral Quick Hops", "Spring (Short)", "Lateral", "Banded", "Bilateral", "Extensive", "Tendon", "Fast‑twitch lateral stiffness"],
  ["Alternating Lunge Jumps", "Spring (Short)", "Vertical", "BW", "Unilateral", "Extensive", "Tendon", "Split‑leg stiffness coordination"],
  ["Broad Jump → Stick", "Shock (Long)", "Horizontal", "BW", "Bilateral", "Intensive", "Muscle", "Stick landing post horizontal impulse"],
  ["Lateral Bound Repeats", "Spring (Short)", "Lateral", "BW", "Unilateral", "Extensive", "Tendon", "Frontal plane reactive bounding"],
  ["Overhead MB Back Toss", "Shock (Long)", "Horizontal", "Loaded", "Bilateral", "Intensive", "Muscle", "Explosive horizontal projection"],
  ["Low Box Hop‑Down → Stick", "Shock (Long)", "Vertical", "BW", "Bilateral", "Mixed", "Landing posture control"],
  ["Depth Drop → Broad Jump", "Shock (Long)", "Horizontal", "Loaded", "Bilateral", "Intensive", "Muscle", "Triple extension landing control"],
  ["Single‑Leg Mini Hops", "Spring (Short)", "Vertical", "BW", "Unilateral", "Extensive", "Tendon", "Rhythmic stiffness SL coordination"],
  ["Rotational Skater Hop", "Shock (Long)", "Lateral", "BW", "Unilateral", "Intensive", "Muscle", "Rotational impulse (hockey)"],
  ["Seated Jump", "Shock (Long)", "Vertical", "Loaded", "Bilateral", "Intensive", "Muscle", "Concentric bias from seated"],
  ["Skater Hop – Continuous", "Spring (Short)", "Lateral", "BW", "Unilateral", "Extensive", "Tendon", "Continuous rhythm skater hops"],
];

const EX = EXERCISES_RAW.map(([name, contact, dir, load, struct, intensity, tissue, notes]) => ({
  name, contact, dir, load, struct, intensity, tissue, notes,
}));

// --- 3D voxel ---
function Voxel({ position, color, active, onClick }) {
  const ref = useRef();
  useFrame((_, dt) => { if (active && ref.current) ref.current.rotation.y += dt * 0.6; });
  return (
    <group position={position}>
      <mesh ref={ref} onClick={onClick} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color={active ? "#22c55e" : color} metalness={0.2} roughness={0.5} />
      </mesh>
    </group>
  );
}

const planeColor = (j) => (j === 0 ? "#60a5fa" : j === 1 ? "#f97316" : "#eab308");

function CubeGrid({ zAxis, onSelect, selected }) {
  // zAxis: "Structure" | "Load"
  const zValues = zAxis === "Structure" ? STRUCTURE : LOAD;
  const voxels = [];
  for (let i = 0; i < CONTACT.length; i++) {
    for (let j = 0; j < DIRECTION.length; j++) {
      for (let k = 0; k < zValues.length; k++) {
        const x = i * 1.2 - 0.6; // Spring→Shock
        const z = (k / (zValues.length - 1)) * 1.2 - 0.6; // scale for 2..4 steps
        const y = j * 1.2 - 1.2; // Vertical→Lateral→Horizontal
        const key = `${CONTACT[i]}|${DIRECTION[j]}|${zAxis}:${zValues[k]}`;
        voxels.push(
          <Voxel
            key={key}
            position={[x, z, y]}
            color={planeColor(j)}
            active={selected === key}
            onClick={() => onSelect(key)}
          />
        );
      }
    }
  }
  return (
    <group>
      {/* Axes labels */}
      <Text position={[1.9, -1.2, 0]} fontSize={0.18} color="#94a3b8">Contact Time →</Text>
      <Text position={[0, -1.2, -2.2]} rotation={[0, Math.PI, 0]} fontSize={0.18} color="#94a3b8">Direction →</Text>
      <Text position={[-1.7, 1.2, 0]} rotation={[Math.PI/2, 0, 0]} fontSize={0.18} color="#94a3b8">{zAxis} ↑</Text>

      {/* Ticks */}
      <Text position={[-0.7, -1.4, 0]} fontSize={0.16} color="#64748b">Spring</Text>
      <Text position={[0.7, -1.4, 0]} fontSize={0.16} color="#64748b">Shock</Text>
      <Text position={[0, -1.4, 0.6]} fontSize={0.16} color="#64748b">Vertical</Text>
      <Text position={[0, -1.4, 0]} fontSize={0.16} color="#64748b">Lateral</Text>
      <Text position={[0, -1.4, -0.6]} fontSize={0.16} color="#64748b">Horizontal</Text>
      {zValues.map((v, idx) => (
        <Text key={v} position={[-1.2, (idx/(zValues.length-1))*1.2-0.6, 0]} rotation={[Math.PI/2, 0, 0]} fontSize={0.14} color="#64748b">{v}</Text>
      ))}
    </group>
  );
}

function useFiltered(exList, selectedKey, tagFilters, zAxis) {
  return useMemo(() => {
    // selectedKey example: "Spring (Short)|Vertical|Structure:Unilateral" or "...|Load:Loaded"
    let contact=null, dir=null, zKey=null, zVal=null;
    if (selectedKey) {
      const [c, d, z] = selectedKey.split("|");
      contact = c; dir = d; [zKey, zVal] = z.split(":");
    }
    return exList.filter((e) => {
      const baseMatch = (!contact || e.contact === contact) && (!dir || e.dir === dir) && (!zVal || (zKey === "Structure" ? e.struct === zVal : e.load === zVal));
      if (!baseMatch) return false;
      const { load, intensity, tissue } = tagFilters;
      const loadOk = load.size ? load.has(e.load) : true;
      const intOk = intensity.size ? intensity.has(e.intensity) : true;
      const tisOk = tissue.size ? tissue.has(e.tissue) : true;
      return loadOk && intOk && tisOk;
    });
  }, [exList, selectedKey, tagFilters, zAxis]);
}

export default function PlyometricExplorerV2() {
  const [zAxis, setZAxis] = useState("Structure");
  const [selected, setSelected] = useState(null);
  const [loadSel, setLoadSel] = useState(new Set());
  const [intSel, setIntSel] = useState(new Set());
  const [tisSel, setTisSel] = useState(new Set());

  const filtered = useFiltered(EX, selected, { load: loadSel, intensity: intSel, tissue: tisSel }, zAxis);
  const toggle = (setFn, value) => setFn((prev) => { const next = new Set(prev); next.has(value) ? next.delete(value) : next.add(value); return next; });

  return (
    <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] bg-slate-50">
      {/* Left: 3D Scene */}
      <div className="relative">
        <Canvas shadows camera={{ position: [3.2, 2.6, 4.2], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 5]} intensity={0.9} castShadow />
          <OrbitControls enablePan={false} />
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -1, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#eef2ff" />
          </mesh>
          <CubeGrid zAxis={zAxis} onSelect={setSelected} selected={selected} />
        </Canvas>
        <div className="absolute top-3 left-3 px-3 py-2 rounded-xl bg-white/85 backdrop-blur shadow text-slate-700">
          <div className="text-sm font-semibold">Plyometric Performance Cube</div>
          <div className="text-xs">Click a cube to filter by: Contact × Direction × {zAxis}</div>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1.5 rounded-xl bg-white/85 backdrop-blur shadow flex items-center gap-2">
          <span className="text-xs text-slate-600">Z‑Axis:</span>
          {(["Structure","Load"]).map(v => (
            <button key={v} onClick={()=>{ setSelected(null); setZAxis(v); }} className={`text-xs px-2 py-1 rounded-lg border ${zAxis===v?"bg-slate-900 text-white border-slate-900":"bg-white text-slate-700 hover:bg-slate-50"}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Right: Filters + Results */}
      <div className="p-4 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">Explorer Panel</h2>
          <button className="text-sm px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900" onClick={() => { setSelected(null); setLoadSel(new Set()); setIntSel(new Set()); setTisSel(new Set()); }}>Clear</button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Current Selection</div>
            <div className="text-slate-800 text-sm">{selected ? selected.replace("|"," • ").replace("|"," • ") : "None (click a cube on the left)"}</div>
          </div>

          <div className="rounded-xl border bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Refine by Tags</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TagGroup label="Load" values={LOAD} selected={loadSel} onToggle={(v)=>toggle(setLoadSel, v)} />
              <TagGroup label="Intensity" values={INTENSITY} selected={intSel} onToggle={(v)=>toggle(setIntSel, v)} />
              <TagGroup label="Target Tissue" values={TISSUE} selected={tisSel} onToggle={(v)=>toggle(setTisSel, v)} />
            </div>
          </div>

          <div className="rounded-xl border bg-white">
            <div className="p-3 border-b text-xs uppercase tracking-wide text-slate-500">Matching Exercises ({filtered.length})</div>
            <div className="divide-y">
              <AnimatePresence>
                {filtered.map((e) => (
                  <motion.div key={e.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="p-3 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">{e.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{e.contact} • {e.dir} • {e.struct} • {e.load}</div>
                        <div className="text-xs text-slate-500">{e.intensity} • {e.tissue}</div>
                        <div className="text-sm text-slate-700 mt-1">{e.notes}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (<div className="p-6 text-center text-slate-500 text-sm">No matches — click a cube and/or loosen tag filters.</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TagGroup({ label, values, selected, onToggle }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <button key={v} onClick={() => onToggle(v)} className={`px-2.5 py-1 rounded-lg border text-xs ${selected.has(v) ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 hover:bg-slate-50"}`}>{v}</button>
        ))}
      </div>
    </div>
  );
}
