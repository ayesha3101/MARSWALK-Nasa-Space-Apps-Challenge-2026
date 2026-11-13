import urllib.request
import os
from PIL import Image
from io import BytesIO

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "pov")
os.makedirs(OUT_DIR, exist_ok=True)

HEADERS = {"User-Agent": "MARSWALK/2.0 (NASA Space Apps Challenge; Mars Science Laboratory)"}

curated_stops = [
    {
        "filename": "hab_site.jpg",
        "title": "Hab Airlock Egress // Bradbury Plains Baseline",
        "sol": 300,
        "url": "http://mars.jpl.nasa.gov/msl-raw-images/msss/00300/mcam/0300ML0012490050106431D01_DXXX.jpg",
        "desc": "Wide-field Mastcam survey of Gale Crater basal plains and gravel regolith looking toward lower Mount Sharp."
    },
    {
        "filename": "stop1_boxwork_ridge.jpg",
        "title": "Ridge Fracture Alpha // Hydrothermal Boxwork Veins",
        "sol": 938,
        "url": "http://mars.jpl.nasa.gov/msl-raw-images/msss/00938/mcam/0938MR0041190580501896C00_DXXX.jpg",
        "desc": "Iconic high-relief boxwork fracture veins exhumed by eolian erosion at Garden City, Gale Crater."
    },
    {
        "filename": "stop2_rover_drop.jpg",
        "title": "Rover Rendezvous // Bedrock Core Extraction",
        "sol": 1065,
        "url": "http://mars.jpl.nasa.gov/msl-raw-images/msss/01065/mcam/1065MR0046870540104892C00_DXXX.jpg",
        "desc": "High-silica bedrock outcrop with drill powder tailings and rover wheel tracks at Buckskin."
    },
    {
        "filename": "stop3_hollow_floor.jpg",
        "title": "Boxwork Polygon Hollow // Basaltic Sand Ripples",
        "sol": 1192,
        "url": "http://mars.jpl.nasa.gov/msl-raw-images/msss/01192/mcam/1192MR0054130000602629E01_DXXX.jpg",
        "desc": "Active dark basalt eolian sand ripples on the deflation floor of the Bagnold Dune hollow."
    },
    {
        "filename": "stop4_sulfate_escarpment.jpg",
        "title": "Sulfate Ridge Escarpment // Murray Buttes",
        "sol": 1450,
        "url": "http://mars.jpl.nasa.gov/msl-raw-images/msss/01450/mcam/1450MR0071830350703259C00_DXXX.jpg",
        "desc": "Towering layered sandstone and sulfate escarpment overlooking the lower Mount Sharp sequence."
    }
]

print("=== Downloading Curated Authentic Gale Crater Mastcam Science Frames ===")
for stop in curated_stops:
    out_path = os.path.join(OUT_DIR, stop["filename"])
    print(f"Fetching {stop['filename']} (Sol {stop['sol']}: {stop['title']})...")
    req = urllib.request.Request(stop["url"], headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        img = Image.open(BytesIO(data)).convert("RGB")
        img.save(out_path, "JPEG", quality=94)
        print(f"  [OK] Saved {stop['filename']}: {img.size}, {len(data)} bytes")

print("=== Complete! ===")
