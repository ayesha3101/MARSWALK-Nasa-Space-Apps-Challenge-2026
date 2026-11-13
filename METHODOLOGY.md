# MARSWALK Methodology

**Slope-aware route planning and consumables modelling for a Mars surface EVA**
Hero mission: Gale Crater / lower Mount Sharp, boxwork region (Sol 1, EVA 1)
*NASA Space Apps Challenge 2026*

---

## Contents

1. [Scope and approach](#1-scope-and-approach)
2. [Terrain data and grid](#2-terrain-data-and-grid)
3. [Slope analysis](#3-slope-analysis)
4. [Route cost model](#4-route-cost-model)
5. [Routing modes and abort logic](#5-routing-modes-and-abort-logic)
6. [Metabolic and oxygen model](#6-metabolic-and-oxygen-model)
7. [Radiation model](#7-radiation-model)
8. [Solar ephemeris and irradiance](#8-solar-ephemeris-and-irradiance)
9. [Surface imagery and image enhancement](#9-surface-imagery-and-image-enhancement)
10. [Parameter register](#10-parameter-register)
11. [Assumptions, validation and limitations](#11-assumptions-validation-and-limitations)
12. [Reproducibility](#12-reproducibility)
13. [References](#13-references)

---

## 1. Scope and approach

Planning a surface EVA is a multi-objective problem: a crew must reach science targets while respecting mobility limits, consumable budgets (oxygen, power) and radiation exposure. A straight-line route can cross terrain that is too steep for a pressurized suit or that costs far more oxygen than a longer, gentler path.

MARSWALK addresses this with three components:

1. **A terrain cost grid** derived from a digital elevation model (DEM).
2. **An A\* route solver** that minimizes a weighted cost over that grid.
3. **A consumables and exposure model** that converts a chosen route into time, oxygen use and dose estimates.

> **Status labels used in this document**
> **Published:** taken from a cited source. **Derived:** computed from data in this project. **Assumption:** an engineering choice made for this prototype and open to change.
> This is a demonstration tool, not flight software. All physiological and suit parameters are assumptions unless marked otherwise.

---

## 2. Terrain data and grid

| Item | Value | Status |
|---|---|---|
| Area of interest | about 5 × 5 km around the boxwork region | Derived |
| Grid size | 256 × 256 cells | Derived |
| Cell size, Δs | 19.53 m (5 km / 256) | Derived |
| Connectivity | 8-connected neighbours | Design choice |
| Elevation source | MOLA-based topography with Gale DTM, resampled to the grid | Published, resampled |

All rasters (elevation, slope, hazard mask, cost components) are precomputed offline by the Python pipeline in `/scripts` and shipped as static files. The browser never processes raw planetary data.

---

## 3. Slope analysis

Slope angle θ is computed from the DEM with a Sobel operator. With kernel responses $S_x$, $S_y$ and the standard 3 × 3 normalization:

$$
\frac{\partial z}{\partial x} = \frac{S_x}{8\,\Delta s}, \qquad
\frac{\partial z}{\partial y} = \frac{S_y}{8\,\Delta s}
$$

$$
\theta = \arctan\!\left(\sqrt{\left(\tfrac{\partial z}{\partial x}\right)^2 + \left(\tfrac{\partial z}{\partial y}\right)^2}\right) \cdot \frac{180^\circ}{\pi}
$$

**Mobility limit.** Cells steeper than a configured limit θ\_max are treated as impassable. The default of 20° is an **assumption** reflecting the reduced stability of suited walking on steep ground, and is not a certified NASA value. Because a 19.5 m cell averages out small features, real local slopes can exceed the gridded value.

**Slope classes shown in the UI**

| Class | Range | Display |
|---|---|---|
| Safe | 0° to 8° | Green |
| Caution | 8° to 15° | Amber |
| Steep | 15° to 20° | Orange |
| Blocked | above 20° | Red, excluded from routing |

---

## 4. Route cost model

The cost of moving from cell A to an adjacent cell B is:

$$
C(A,B) = d_{xy}(A,B)\,\Big[\,1 + w_{\text{slope}}\,\phi(\theta) + w_{\text{climb}}\,\max(0,\Delta z) + w_{\text{rad}}\,\Psi + H\,\Big]
$$

| Term | Meaning |
|---|---|
| $d_{xy}$ | Horizontal step length: Δs for orthogonal moves, √2·Δs ≈ 27.62 m for diagonal moves |
| $\phi(\theta)$ | Slope penalty (below) |
| $\Delta z$ | Elevation gain of the step, in metres |
| $\Psi$ | Relative radiation penalty, the dose-rate excess over the baseline, $\Psi = \dot D(z,\theta)/\dot D_0 - 1$ |
| $H$ | Hazard penalty from the roughness and geologic-unit mask; cells inside the hard exclusion mask are impassable |
| $w_{\bullet}$ | Weights set by the routing mode |

The slope penalty grows quadratically and becomes infinite at the mobility limit:

$$
\phi(\theta) =
\begin{cases}
\left(\dfrac{\theta}{\theta_{\max}}\right)^{2} & \theta \le \theta_{\max} \\[2mm]
\infty & \theta > \theta_{\max}
\end{cases}
$$

Weights $w_{\text{climb}}$, $w_{\text{rad}}$ and the hazard penalties are defined in the routing configuration in the source code.

---

## 5. Routing modes and abort logic

### 5.1 Pathfinding

Routes are found with **A\*** using an admissible Euclidean-distance heuristic scaled by the minimum per-metre cost (1.0), so solutions are optimal for the cost model above. The solver runs in a **Web Worker** so the interface stays responsive while waypoints are dragged. Multi-stop routes are built by chaining legs:
`Hab → S1 → S2 → S3 → S4 → Hab`.

### 5.2 Modes

| Mode | $w_{\text{slope}}$ | $\theta_{\max}$ | Intent |
|---|---|---|---|
| **Fastest** | 1.3 | 20° | Minimize time and effort between waypoints |
| **Safest** | 4.8 | 16° | Prefer gentle ground, even at the cost of a longer path |

Safest mode is designed to trade a modest increase in distance for lower slope exposure. The actual trade-off for each leg is reported in the app rather than assumed.

### 5.3 Abort to Hab

When the abort control is used:

1. The crew member's **current position** on the timeline is taken as the start.
2. The solver runs A\* to the habitat airlock.
3. The slope limit is tightened to **15°** to favour reliable, hurried travel.
4. The route, distance to go and estimated time to ingress are overlaid on the HUD.

---

## 6. Metabolic and oxygen model

Oxygen use is estimated per route segment from walking speed and slope.

**Walking speed** uses Tobler's hiking function, scaled to a suited-walking top speed:

$$
v(\theta) = v_0 \,\exp\!\big(-3.5\,\lvert \tan\theta + 0.05 \rvert\big)\quad [\text{m/s}], \qquad v_0 = 1.05\ \text{m/s}
$$

The original function (Tobler, 1993) peaks near 6 km/h on a slight descent; $v_0$ is an **assumption** that reduces this for a pressurized suit and load.

**Oxygen consumption rate:**

$$
\dot V_{O_2}(\theta, v) = \dot V_{\text{rest}} + \dot V_{\text{walk}}(v)\,\big[1 + f_{\text{incline}}(\theta)\big]
$$

where $\dot V_{\text{rest}} = 0.82$ L/min and $\dot V_{\text{walk}}(v)$ is the level-ground walking cost as a function of speed, as parameterized in the source code.

**Incline factor.** This is a custom, piecewise empirical curve inspired by published work on the energy cost of uphill and downhill walking (e.g. Minetti et al., 2002). It is **not** a direct implementation of any single published equation. It is continuous at 0° and at the −9° transition.

$$
f_{\text{incline}}(\theta) =
\begin{cases}
3.2\left(\dfrac{\theta}{20}\right)^{1.85} & \theta \ge 0 \\[3mm]
-0.25\,\dfrac{\lvert\theta\rvert}{9} & -9^\circ \le \theta < 0 \\[3mm]
-0.25 + 0.40\,\dfrac{\lvert\theta\rvert - 9}{11} & \theta < -9^\circ
\end{cases}
$$

**Mass and gravity.** The suited crew member is modelled as 140 kg total mass (assumption). At Mars surface gravity of about 3.72 m/s² this corresponds to a weight of roughly 520 N.

**Total oxygen for a route** with $N$ segments, segment duration $\Delta t_k = d_k / v_k$, and on-site dwell time $t_{\text{dwell}}$:

$$
O_2^{\text{total}} = \sum_{k=1}^{N} \frac{\dot V_{O_2,k}}{60}\,\Delta t_k \;+\; \frac{\dot V_{\text{rest}}}{60}\,t_{\text{dwell}} \quad [\text{L}]
$$

with time in seconds and rates in L/min.

---

## 7. Radiation model

Dose rate along the route is estimated from Curiosity's Radiation Assessment Detector (RAD) baseline:

$$
\dot D(z,\theta) = \left[\dot D_0 + \alpha_{\text{elev}}\,\frac{z - z_0}{100\ \text{m}}\right] S_{\text{ridge}}(\theta)
$$

| Parameter | Value | Status |
|---|---|---|
| $\dot D_0$ | 27.2 µSv/h at the Gale datum, equivalent to about 0.65 mSv per sol | Published baseline, rounded (Hassler et al., 2014) |
| $z_0$ | about −4450 m | Approximate datum |
| $\alpha_{\text{elev}}$ | 0.75 µSv/h per 100 m of ascent, reflecting reduced atmospheric shielding at higher elevation | Assumption |
| $S_{\text{ridge}}$ | 0.88 for travel along the base of a boxwork wall > 10° high, otherwise 1.0 | Assumption |

The dose shown in the app is a **reference estimate** for planning discussion. It does not model solar particle events, which can raise dose rates sharply.

---

## 8. Solar ephemeris and irradiance

Solar elevation $\alpha_s$ at latitude $\varphi$, solar declination $\delta$ and hour angle $h$:

$$
\sin\alpha_s = \sin\varphi\,\sin\delta + \cos\varphi\,\cos\delta\,\cos h
$$

Declination follows from the solar longitude $L_s$ and axial obliquity $\varepsilon = 25.19^\circ$:

$$
\sin\delta = \sin\varepsilon\,\sin L_s
$$

Direct irradiance on a horizontal surface, attenuated by dust optical depth $\tau$:

$$
I = S_0\,\max(0,\sin\alpha_s)\,\exp\!\left(-\frac{\tau}{\max(0.12,\ \sin\alpha_s)}\right)
$$

| Parameter | Value | Note |
|---|---|---|
| Latitude $\varphi$ | site centre latitude of the area of interest | Same site as the route grid |
| $L_s$ | 70° | Mission season, an assumption |
| $S_0$ | 590 W/m² | Mean solar constant at Mars's average distance. Near $L_s \approx 70^\circ$ Mars is close to aphelion, so the true value is lower (roughly 15%) and **irradiance is slightly overestimated** |
| $\tau$ | 0.65 | Representative optical depth, an assumption |

Local Mean Solar Time (LMST) drives the hour angle and the on-screen sol clock.

---

## 9. Surface imagery and image enhancement

Each stop shows a real Curiosity Mastcam image from the NASA Planetary Data System (PDS) so the crew can preview terrain character.

| Camera | Focal length | Field of view | Scale |
|---|---|---|---|
| Mastcam-34 | 34 mm, f/8 | about 15° × 15° | 0.22 mrad/pixel |
| Mastcam-100 | 100 mm, f/10 | about 5.1° × 5.1° | 0.074 mrad/pixel |

**Important:** Curiosity images are taken at many locations along its traverse. Images used at a stop are **analog views of similar terrain** and are labelled with their sol and location in the app. They are not photographs of the exact planned stop.

**Enhancements** (decorrelation stretch and a near-infrared band ratio using the 1013 nm filter) are display techniques to emphasise colour and mineral contrast. They do not add measured information.

---

## 10. Parameter register

| Symbol | Description | Value | Basis |
|---|---|---|---|
| Δs | Grid cell size | 19.53 m | Derived |
| θ\_max (fast) | Slope limit | 20° | Assumption |
| θ\_max (safe) | Slope limit | 16° | Assumption |
| θ\_abort | Abort slope limit | 15° | Assumption |
| $w_{\text{slope}}$ | Slope weight (fast / safe) | 1.3 / 4.8 | Tuned |
| $v_0$ | Peak suited walking speed | 1.05 m/s | Assumption |
| $\dot V_{\text{rest}}$ | Resting oxygen rate | 0.82 L/min | Assumption |
| $m_{\text{total}}$ | Suited mass | 140 kg | Assumption |
| $\dot D_0$ | Baseline dose rate | 27.2 µSv/h | Published, rounded |
| $\alpha_{\text{elev}}$ | Elevation dose gradient | 0.75 µSv/h per 100 m | Assumption |
| $S_{\text{ridge}}$ | Ridge shielding factor | 0.88 | Assumption |
| $\varepsilon$ | Mars obliquity | 25.19° | Published |
| $L_s$ | Solar longitude | 70° | Assumption |
| $\tau$ | Optical depth | 0.65 | Assumption |

Remaining weights ($w_{\text{climb}}$, $w_{\text{rad}}$, $H$) live in the routing configuration in the source code.

---

## 11. Assumptions, validation and limitations

**Validation performed**
- Unit tests cover the slope calculation and the A\* solver (optimality on known grids, blocked-cell handling, determinism).
- Route stop locations are checked against the regions labelled on NASA's Curiosity proposed-path map for lower Mount Sharp.

**Known limitations**
- A 19.5 m grid cannot capture boulders, small scarps or loose-sand hazards that matter for walking.
- Suit mobility, mass and metabolic parameters are simplified assumptions, not outputs of suit testing.
- The radiation model uses a published baseline with assumed gradients and ignores solar particle events.
- Weather and dust values are representative references, not forecasts.
- The crew and mission are fictional and for illustration.

---

## 12. Reproducibility

```bash
cd scripts
pip install -r requirements.txt
python generate_terrain_data.py     # rebuilds DEM, slope, hazard and cost rasters
cd ..
npm test                            # slope and A* unit tests
```

Every layer in the app carries a **REAL / DERIVED / SIMULATED** badge, and the Data and Assumptions panel lists the source, instrument and resolution of each.

---

## 13. References

1. Hassler, D. M., et al. (2014). *Mars' surface radiation environment measured with the Mars Science Laboratory's Curiosity rover.* Science, 343(6169).
2. Tobler, W. (1993). *Three presentations on geographical analysis and modeling.* NCGIA Technical Report 93-1.
3. Minetti, A. E., et al. (2002). *Energy cost of walking and running at extreme uphill and downhill slopes.* Journal of Applied Physiology, 93(3).
4. Bell, J. F., et al. (2017). *The Mars Science Laboratory Curiosity rover Mastcam instruments: Preflight and in-flight calibration, validation, and data archiving.* Earth and Space Science, 4.
5. NASA/JPL Mars Trek: https://trek.nasa.gov/mars/
6. USGS-NASA Planetary Geologic Mapping Program: https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars
7. NASA, *Curiosity's proposed path up Mount Sharp*: https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/