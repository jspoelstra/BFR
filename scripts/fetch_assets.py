#!/usr/bin/env python3
"""
Fetch a small set of public assets into the assets folder.

Preferred: FAA Aeronautical Chart Users' Guide and FAA Runway Safety publications.
As some FAA pages don’t provide direct image URLs, this script currently uses
Wikimedia-hosted SVGs/PNGs depicting similar standardized symbols/markings.
Replace with direct FAA image URLs if available.
"""
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Map of local path -> remote URL
TARGETS = {
    # Sectional-like symbols
    os.path.join(ROOT, 'assets/sectional/towered-airport.svg'): 'https://upload.wikimedia.org/wikipedia/commons/6/68/Airport_symbol_towered.svg',
    os.path.join(ROOT, 'assets/sectional/nontowered-airport.svg'): 'https://upload.wikimedia.org/wikipedia/commons/2/28/Airport_symbol_untowered.svg',
    os.path.join(ROOT, 'assets/sectional/vor.svg'): 'https://upload.wikimedia.org/wikipedia/commons/3/3b/VOR_symbol.svg',
    os.path.join(ROOT, 'assets/sectional/restricted-area.svg'): 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Restricted_area_symbol.svg',

    # Runway markings
    os.path.join(ROOT, 'assets/runway/threshold.svg'): 'https://upload.wikimedia.org/wikipedia/commons/3/33/Runway_threshold_markings.svg',
    os.path.join(ROOT, 'assets/runway/displaced-threshold.svg'): 'https://upload.wikimedia.org/wikipedia/commons/8/8b/Displaced_threshold.svg',
    os.path.join(ROOT, 'assets/runway/touchdown-zone.svg'): 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Touchdown_zone_markings.svg',
    os.path.join(ROOT, 'assets/runway/hold-short.svg'): 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Hold_short_markings.svg',

    # FAA PDFs for local reference (attribution, not used directly in UI)
    os.path.join(ROOT, 'assets/FAA_Aeronautical_Chart_Users_Guide_20250612.pdf'): 'https://aeronav.faa.gov/user_guide/cug-complete_20250612.pdf',
    os.path.join(ROOT, 'assets/FAA_Airport_Signs_Markings_Lights.pdf'): 'https://www.faa.gov/airports/runway_safety/publications/Airport-Signs-Markings-Lights.pdf',
}

def ensure_dirs():
    for path in TARGETS.keys():
        d = os.path.dirname(path)
        os.makedirs(d, exist_ok=True)

def fetch_all():
    ensure_dirs()
    for dest, url in TARGETS.items():
        try:
            print(f'Downloading {url} -> {dest}')
            urllib.request.urlretrieve(url, dest)
        except Exception as e:
            print(f'Failed to download {url}: {e}', file=sys.stderr)

if __name__ == '__main__':
    fetch_all()
