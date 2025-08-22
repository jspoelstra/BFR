# Attribution and Asset Provenance

This project includes training visuals and references for educational use. This document provides comprehensive documentation of asset sources, licensing, and refresh procedures.

## Asset Provenance Chain

### Primary Sources (Preferred)

**FAA Official Publications** - Public Domain
- **FAA Aeronautical Chart Users' Guide** (Effective June 12, 2025)
  - Source: https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/aero_guide/
  - Direct URL: https://aeronav.faa.gov/user_guide/cug-complete_20250612.pdf
  - Local copy: `assets/FAA_Aeronautical_Chart_Users_Guide_20250612.pdf`
  - License: Public domain (U.S. government work)
  
- **FAA Airport Signs, Markings, and Lights Guide**
  - Source: https://www.faa.gov/airports/runway_safety/publications
  - Direct URL: https://www.faa.gov/airports/runway_safety/publications/Airport-Signs-Markings-Lights.pdf
  - Local copy: `assets/FAA_Airport_Signs_Markings_Lights.pdf`
  - License: Public domain (U.S. government work)

### Secondary Sources (Fallback)

**Wikimedia Commons Educational Symbols** - Various Open Licenses
- **Sectional Chart Symbols** (`assets/sectional/`)
  - Airport symbols (towered/nontowered), VOR, restricted areas
  - Source: https://commons.wikimedia.org/
  - License: Various (CC BY-SA, public domain - verify each file)
  - Purpose: Educational placeholders until official FAA vector graphics become available
  
- **Runway Marking Symbols** (`assets/runway/`)
  - Threshold, displaced threshold, touchdown zone, hold-short markings
  - Source: https://commons.wikimedia.org/
  - License: Various (CC BY-SA, public domain - verify each file)  
  - Purpose: Simplified educational representations inspired by FAA symbology

## Asset Refresh Procedures

### Automatic Refresh
Run the asset fetching script:
```bash
python3 scripts/fetch_assets.py
```

**Expected Behavior:**
- FAA PDFs: Should download successfully
- Wikimedia SVGs: May fail with 404 errors (URLs change frequently)
- Application continues to work with built-in fallback SVGs

### Manual Refresh
1. **For FAA Publications:**
   - Visit source URLs listed above
   - Download latest versions manually
   - Place in `assets/` folder with appropriate names

2. **For Visual Symbols:**
   - Extract official symbols from FAA publications (preferred)
   - Use Wikimedia Commons as educational placeholders
   - Verify licensing compatibility before distribution

### Asset Status Verification
Check asset availability in the application:
1. Open the BFR Trainer application
2. Navigate to "About & Sources" tab
3. Review "Asset Status" section
4. Assets show "OK" (loaded) or "missing (using fallback)"

## Licensing Considerations

### Redistribution Guidelines
- **FAA Publications**: Public domain, freely redistributable
- **Wikimedia Assets**: Check individual file licenses on Wikimedia Commons
- **Application Code**: MIT License (see LICENSE file)

### License Compatibility
When redistributing this project:
1. Verify current Wikimedia asset licenses
2. Include proper attribution for any CC-licensed content
3. Consider replacing placeholders with official FAA assets
4. Update this ATTRIBUTION.md file if sources change

### Educational Use
This project is designed for educational purposes under fair use principles. Users should:
- Verify license compliance for commercial use
- Prefer official FAA sources over placeholder content
- Maintain attribution for all third-party content

## Technical Notes

- Assets are gracefully degraded: missing files trigger fallback to built-in SVGs
- The application functions fully without any external assets
- Asset fetching supplements rather than replaces core functionality
- URLs may change; built-in assets provide stability