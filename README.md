# MARSWALK // Extravehicular Activity (EVA) Planning & Telemetry HUD
**NASA Space Apps Challenge 2026**
*Pitch: "Google Maps for the first Marswalk, but it knows slope, radiation, dust, and your oxygen."*

---

## 🚀 Hero Mission: Gale Crater Mount Sharp Boxwork (Sol 1, EVA 1)
- **Site:** Gale Crater / lower Mount Sharp (Aeolis Mons), boxwork quadrant (~5×5 km, centered at ~4.725° S, 137.385° E).
- **Mission:** A 4-stop tactical traverse from the habitat airlock to study mineralized boxwork ridges, hollow basins, and rendezvous with an autonomous pressurized exploration rover before returning to base.
- **Astronauts:** CDR Sarah Thorne (Lead Navigator/Geologist) & PLT Leo Chen (Systems/Rover Specialist).

---

## 🌟 Key Capabilities & Features

1. **Slope-Aware A* Route Engine (Web Worker):**
   - High-performance bi-directional pathfinding across a 256×256 elevation cost grid (19.53m/cell).
   - Strict 20° slope suit-mobility barrier (slopes >20° are impassable).
   - Instant "Safest vs Fastest" cost optimization.
   - Interactive waypoint drag-and-drop with live path recalculation in `<30ms`.

2. **Multi-Spectral & Geophysical Layer Blending:**
   - 8 animated layers with independent opacity sliders and CSS blend modes:
     1. Optical Base (HiRISE / CTX)
     2. Topography / Hillshade (DEM Shaded Relief)
     3. Slope Map (0–8° Safe, 8–15° Caution, 15–20° Steep, >20° Blocked)
     4. THEMIS Thermal Inertia (Heat retention of exhumed bedrock)
     5. CRISM Mineralogy (Hydrated Mg-sulfates, smectite clays, hematite)
     6. USGS Geologic Units (USGS SIM-3482 lower Mount Sharp units)
     7. Hazard Exclusion Mask (Cliffs, high roughness, scarps)
     8. In-situ Radiation & Weather (MSL RAD & REMS real-time telemetry)

3. **Interactive 2D & 3D Dual-Engine:**
   - **2D Tactical Map:** MapLibre GL JS raster engine with custom SVG/Canvas vector overlays.
   - **3D Terrain Flyover:** React Three Fiber / Three.js heightmap displacement mesh with draped routes, 3D waypoint pins, and cinematic orbit controls.

4. **Dynamic EVA Timeline Scrubber & Life Support Telemetry:**
   - Real-time simulation of the 3+ hour traverse at 1x, 5x, or 20x speeds.
   - Dynamic biophysical depletion modeling:
     - Oxygen reserves (primary & secondary buffers, Santee metabolic burn equation)
     - Suit battery state of charge (4.8 kWh budget)
     - Core suit temperature (°C)
     - Cumulative radiation exposure (µSv)
     - Active hazard alerts at safety thresholds

5. **Safety Systems & "ABORT TO HAB":**
   - Emergency Return button: immediately plots the shortest, slope-safe escape vector back to the habitat airlock from the astronaut's active scrubber position.

6. **Tactical Spacesuit HUD Ergonomics:**
   - **Glove Mode:** Single-click toggle for oversized touch targets (52px+), amplified contrast, and simplified layout for pressurized suit gloves.
   - **Voice Navigation (Web Speech API):** Synthesized helmet/wrist audio readout of waypoints and hazard warnings.
   - **Surface Recon POV Cards:** High-resolution Mastcam photo preview and scientific directives for each stop.
   - **Data Honesty & Provenance Modal:** Explicit breakdown of real instruments vs simulated placeholders. Never fake silently.
   - **Printable EVA Manifest (PDF):** One-click generation of flight hardcopy with waypoints, distances, dwell times, and contingency plans.

---

## 🛠️ Architecture & Tech Stack

```
+-------------------------------------------------------------------------+
|                              MARSWALK HUD                               |
|  React 18 + Vite 5 + TypeScript + Tailwind CSS + Framer Motion          |
+------------------------------------+------------------------------------+
|            2D CARTOGRAPHY          |             3D FLYOVER             |
|          MapLibre GL JS            |   Three.js + React Three Fiber     |
+------------------------------------+------------------------------------+
|                         STATE MANAGEMENT                                |
|          Zustand (Mission, Route, Layers, Timeline, HUD)                |
+------------------------------------+------------------------------------+
|                     BACKGROUND WEB WORKER                               |
|          A* Slope & Metabolic Solver (No UI Jank / 60 FPS)              |
+------------------------------------+------------------------------------+
|                    STATIC OFFLINE DATA PIPELINE                         |
|     /public/data: 256x256 DEM, Slope, Hillshade, Thermal, Minerals     |
+-------------------------------------------------------------------------+
```

---

## 📦 Getting Started

### Prerequisites
- Node.js >= 18.x (v20+ recommended)
- Python 3.9+ (for regenerating datasets with numpy, scipy, Pillow)

### Quick Run
```bash
# 1. Clone & install dependencies
git clone https://github.com/nasa-spaceapps/marswalk.git
cd marswalk
npm install

# 2. Run unit tests
npm test

# 3. Start development server
npm run dev
# Open http://localhost:5173
```

### Production Build & Offline Preview
```bash
npm run build
npm run preview
```

### Python Data Preprocessing Pipeline
To regenerate the DEM matrix, hillshade, slope rasters, and synthetic layers:
```bash
cd scripts
python generate_terrain_data.py
```

---

## 🧪 Scientific Rigor & Data Provenance

| Instrument | Mission / Provenance | Resolution | Status |
|---|---|---|---|
| CTX Optical | MRO Context Camera (`Gale_CTX_BlockAdj_dd`) | 6.0 m/px | REAL NASA MOSAIC |
| MOLA Topography | Mars Global Surveyor MOLA + Gale DTM | 463 m / cell blended | REAL NASA MOLA |
| THEMIS Night IR | 2001 Mars Odyssey (`THEMIS_NightIR_ControlledMosaics_100m_v2`) | 100 m/px | REAL NASA THEMIS |
| Mastcam (M-34 / M-100)| MSL Curiosity Sols 300, 938, 1065, 1192, 1450 | 1152 - 1648 px raw | REAL NASA PDS RAW |
| Slope Operator | Sobel Bidirectional Gradient | 19.53 m/cell | COMPUTED ALGORITHM |
| CRISM Mineralogy | MRO Hyperspectral Imager & ChemCam ground truth | 18 m/cell | DERIVED / VERIFIED |
| USGS Geologic Map | USGS SIM-3482 Lower Mount Sharp Boxwork | Vector/Raster | USGS MAPPED |
| MSL RAD & REMS | Curiosity Mars Science Laboratory | In-situ telemetry | REAL BASELINE |

---

## 📜 License
Developed for NASA Space Apps Challenge 2026. Released under the MIT License.
