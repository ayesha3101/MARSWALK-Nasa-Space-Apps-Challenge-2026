# MARSWALK: Mathematical Methodology & Biophysical Route Modeling
**Tactical Navigation & Consumable Optimization for Gale Crater Boxwork (Sol 1, EVA 1)**
*NASA Space Apps Challenge 2026*

---

## 1. Overview & Operational Problem
Planning an Extravehicular Activity (EVA) on Mars is a multi-objective optimization problem under life-critical constraints. An astronaut in an Exploration Extravehicular Mobility Unit (xEMU) encounters terrain slope limits, metabolic oxygen depletion, cumulative radiation exposure, and mechanical suit stiffness. 

A traditional Euclidean "shortest path" often routes across sheer ridge faces, inducing catastrophic slip hazards or unmanageable metabolic spikes ($>300 \text{ kcal/hr}$). MARSWALK solves this by computing a slope-aware, biophysically constrained A* trajectory across a 19.53 m/cell digital elevation model (DEM) of lower Mount Sharp.

---

## 2. Terrain Cost Grid & Pathfinding Function

The traversal cost $C(A, B)$ of stepping from cell $A$ to an adjacent 8-connected cell $B$ is defined as:

$$C(A, B) = d_{xy}(A, B) \times \left[ 1.0 + w_{\text{slope}} \cdot \phi(\theta) + w_{\text{climb}} \cdot \max(0, \Delta z) + w_{\text{rad}} \cdot \Psi(z, \theta) + H \right]$$

### 2.1 Spatial Distance $d_{xy}(A, B)$
For grid coordinates $(x_A, y_A)$ and $(x_B, y_B)$ with cell resolution $\Delta s = 19.53\text{ m}$:
$$d_{xy}(A, B) = \begin{cases} 
\Delta s & \text{orthogonal steps } (\Delta x = 0 \text{ or } \Delta y = 0) \\
\sqrt{2} \cdot \Delta s \approx 27.62\text{ m} & \text{diagonal steps}
\end{cases}$$

### 2.2 Slope Angle $\theta$ and Suit Mobility Barrier
The terrain inclination angle $\theta$ in degrees is derived from the bidirectional Sobel elevation gradient:
$$\theta = \arctan\left(\frac{\sqrt{(\partial z / \partial x)^2 + (\partial z / \partial y)^2}}{\Delta s}\right) \times \frac{180^\circ}{\pi}$$

**The 20° Suit Mobility Barrier:**
Pressurized planetary suits have rigid lower-torso assemblies (LTA) and limited ankle articulation. Field analog testing (NASA Desert RATS and Apollo lunar telemetry) indicates unassisted suit walking becomes unstable above $20^\circ$.
$$\phi(\theta) = \begin{cases} 
\infty & \text{if } \theta > \theta_{\text{max}} \quad (20.0^\circ \text{ suit barrier: cell is impassable}) \\
\left(\frac{\theta}{\theta_{\text{max}}}\right)^2 & \text{if } \theta \le \theta_{\text{max}}
\end{cases}$$

### 2.3 Safest vs. Fastest Cost Weights
- **Safest Mode:** $w_{\text{slope}} = 4.8$, $\theta_{\text{max}} = 16.0^\circ$. Strictly favors low-grade valley floors, avoiding ridge cliffs even if traversal distance is increased by 15–25%.
- **Fastest Mode:** $w_{\text{slope}} = 1.3$, $\theta_{\text{max}} = 20.0^\circ$. Direct metabolic minimum vector between waypoints.

---

## 3. Biophysical Metabolic Model (Santee & Margaria-Minetti)

Astronaut oxygen consumption ($\dot{V}_{\text{O}_2}$ in $\text{L/min}$) and energy expenditure ($P$ in $\text{kcal/hr}$) are calculated dynamically for every step along the route based on suit weight and local incline:

$$\dot{V}_{\text{O}_2}(\theta, v) = \dot{V}_{\text{rest}} + \dot{V}_{\text{walk}}(v) \cdot \left[1.0 + f_{\text{incline}}(\theta)\right]$$

Where:
- $\dot{V}_{\text{rest}} = 0.82\text{ L/min}$ (baseline suit life support demand at rest).
- Effective weight on Mars ($g_{\text{Mars}} = 3.72\text{ m/s}^2$): $m_{\text{total}} = 140\text{ kg} \implies W_{\text{Mars}} \approx 520\text{ N}$.
- Walking speed $v(\theta)$ is governed by Tobler's Martian hiking formula:
  $$v(\theta) = 1.05 \cdot \exp\left(-3.5 \cdot \left|\tan(\theta) + 0.05\right|\right) \quad [\text{m/s}]$$
- Incline factor $f_{\text{incline}}(\theta)$:
  $$f_{\text{incline}}(\theta) = \begin{cases}
  3.2 \cdot \left(\frac{\theta}{20.0}\right)^{1.85} & \text{for uphill climbs } (\theta \ge 0) \\
  -0.25 \cdot \left(\frac{|\theta|}{9.0}\right) & \text{for gentle downhill } (-9^\circ \le \theta < 0) \\
  0.15 \cdot \left(\frac{|\theta| - 9.0}{11.0}\right) & \text{for steep downhill braking } (\theta < -9^\circ)
  \end{cases}$$

Total consumed oxygen across $N$ path segments with dwell times $t_{\text{dwell}}$:
$$\text{O}_2^{\text{total}} = \sum_{k=1}^{N} \left(\frac{\dot{V}_{\text{O}_2, k}}{60} \cdot \Delta t_k\right) + \left(\frac{0.82}{60} \cdot t_{\text{dwell}}\right) \quad [\text{Liters}]$$

---

## 4. Radiation Exposure Model (MSL RAD Baseline)

Surface radiation dose rate $\dot{D}$ in $\mu\text{Sv/h}$ is modeled using empirical in-situ measurements from Curiosity's Radiation Assessment Detector (RAD):
$$\dot{D}(z, \theta) = \left[\dot{D}_0 + \alpha_{\text{elev}} \cdot \frac{z - z_0}{100\text{ m}}\right] \cdot S_{\text{ridge}}(\theta)$$

Where:
- $\dot{D}_0 = 27.2\ \mu\text{Sv/h}$ (Galactic Cosmic Ray floor baseline at Gale datum $z_0 = -4450\text{ m}$, equivalent to $\approx 0.65\text{ mSv/sol}$).
- Atmospheric shielding gradient: $\alpha_{\text{elev}} = 0.75\ \mu\text{Sv/h per 100m}$ ascent (thinner Martian atmosphere at higher elevations provides less column shielding).
- Ridge shielding factor $S_{\text{ridge}}(\theta) = 0.88$ if the path travels along the base of a $>10^\circ$ boxwork wall oriented away from solar particle events.

---

## 5. Emergency Abort Algorithm ("ABORT TO HAB")
When the astronaut or flight controller engages the emergency return protocol:
1. The system captures the astronaut's active coordinate $[x_{\text{curr}}, y_{\text{curr}}]$ from the telemetry state.
2. The Web Worker immediately executes a prioritized A* solver targeting the pressurized habitat airlock $[x_{\text{hab}}, y_{\text{hab}}]$.
3. Maximum slope threshold is clamped to $15.0^\circ$ to prevent running-speed slips, and the shortest non-hazardous vector is dynamically overlaid on the HUD with distance-to-go and estimated time-to-ingress.

---

## 6. Gale Crater Solar Ephemeris & Surface Irradiance Model
Astronomical positioning for Gale Crater ($-4.5895^\circ\text{ S}, 137.4417^\circ\text{ E}$) calculates Local Mean Solar Time (LMST), solar elevation angle $\alpha_s$, solar azimuth $\theta_s$, and direct surface flux irradiance $I_{\text{surface}}$ ($W/m^2$):

$$\sin(\alpha_s) = \sin(\phi) \sin(\delta) + \cos(\phi) \cos(\delta) \cos(h)$$

$$I_{\text{surface}} = S_0 \cdot \max(0, \sin(\alpha_s)) \cdot \exp\left( -\frac{\tau}{\max(0.12, \sin(\alpha_s))} \right)$$

Where:
- $S_0 = 590\ W/m^2$ (Mars solar constant at $1.52\text{ AU}$).
- $\tau = 0.65$ (optical depth measured by MSL REMS UV sensor).
- Declination $\delta$ derived from Mars solar longitude $L_s = 70.0^\circ$ and obliquity $\epsilon = 25.19^\circ$.

---

## 7. Curiosity Mastcam Science Reconnaissance & Band Math
Each waypoint is matched with authentic Curiosity Mastcam raw observations from the NASA Planetary Data System (PDS):
- **Mastcam-34 (M-34):** 34mm focal length, $f/8$, $15^\circ \times 15^\circ$ field of view, $0.22\text{ mrad/pixel}$ (used for Hab egress landscape and Bagnold dune ripple field).
- **Mastcam-100 (M-100):** 100mm focal length telephoto, $f/10$, $5.1^\circ \times 5.1^\circ$ field of view, $0.074\text{ mrad/pixel}$ (used for Garden City hydrothermal boxwork veins, Buckskin drill core, and Murray Buttes sulfate escarpment).
- **Multispectral Enhancement:** Interactive Decorrelation Stretch (D-Stretch) and 1013nm near-infrared band ratio simulation to highlight iron oxide precipitates and sulfate veins.
