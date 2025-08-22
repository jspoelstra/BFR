#!/usr/bin/env python3
"""
Fetch a small set of public assets into the assets folder.

ASSET PROVENANCE:
This script downloads assets from two primary sources:

1. Official FAA Publications (PREFERRED):
   - FAA Aeronautical Chart Users' Guide (public domain)
   - FAA Airport Signs, Markings, and Lights guide (public domain)
   Source: https://www.faa.gov/ (U.S. government works)

2. Wikimedia Commons SVG Symbols (FALLBACK):
   - Sectional chart symbols (airports, VOR, restricted areas)
   - Runway marking diagrams (thresholds, hold-short lines)
   Source: https://commons.wikimedia.org/ (various open licenses)
   
   Note: These are simplified educational representations inspired by
   official FAA symbology. They serve as placeholders until official
   FAA vector graphics become available via direct URLs.

ASSET REFRESH PROCEDURE:
To refresh all assets:
1. Run: python3 scripts/fetch_assets.py
2. Check console output for any download failures
3. Verify assets in the application's "About & Sources" page
4. Replace any Wikimedia placeholders with official FAA assets if available

LICENSING CONSIDERATIONS:
- FAA publications: Public domain (U.S. government works)
- Wikimedia assets: Various open licenses (CC BY-SA, public domain)
- Always verify license compatibility before redistribution
- See ATTRIBUTION.md for detailed licensing information

FAILURE HANDLING:
If downloads fail (common with Wikimedia URLs that may change):
- The application gracefully falls back to built-in SVG symbols
- Check "About & Sources" page for asset status
- Existing assets in repository provide core functionality
- Manual replacement with official sources is recommended

The script supplements existing assets and is not required for basic functionality.

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
