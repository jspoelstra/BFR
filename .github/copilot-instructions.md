# BFR Trainer (FAR Part 91) - Development Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Quick Start
- Start local development server immediately:
  - **Python method (recommended)**: `python3 -m http.server 5173` - starts in under 2 seconds
  - **Node.js method**: `npm -g install serve && serve -l 5173 .` - install takes ~8 seconds, server starts instantly
- Open `http://localhost:5173/` to view the application
- **No build step required** - this is a pure static site with vanilla JavaScript ES6 modules

### Validated Setup Commands
All commands below have been tested and verified to work:

```bash
# Method 1: Python (built-in, fastest setup)
cd /path/to/BFR
python3 -m http.server 5173
# TIMING: Starts in 1-2 seconds

# Method 2: Node.js (requires one-time setup)
npm -g install serve  # One-time: takes ~8 seconds
cd /path/to/BFR  
serve -l 5173 .
# TIMING: Setup 8 seconds, starts instantly after install
```

### Asset Management
- Download additional training assets: `python3 scripts/fetch_assets.py`
- **Note**: Script may fail in restricted network environments - this is expected
- All required assets are already included in the repository
- Assets are validated automatically in the app's "About & Sources" page

### Application Validation
**ALWAYS** test functionality after making changes by:
1. Start the server using either method above
2. Navigate to `http://localhost:5173/`
3. Test each main section:
   - **Study**: Click sections, verify content loads, test search functionality
   - **Flashcards**: Flip cards, test "I knew it"/"Didn't know" buttons
   - **Quizzes**: Take a quiz, verify multiple choice works
   - **About & Sources**: Verify all assets show "OK" status
   - **Progress**: Check tracking works, test export/import
4. Verify no JavaScript errors in browser console

### Core Application Features
- **Study Mode**: Browse and search 200+ FAR Part 91 sections with progress tracking
- **Flashcards**: Interactive cards with keyboard shortcuts (Space/Y/N)
- **Quiz Mode**: Multiple choice questions with immediate feedback
- **Visual Training**: Sectional chart symbols and runway markings identification
- **Progress Tracking**: Persistent localStorage with export/import capability
- **Search**: Real-time search across all Part 91 content

## Technical Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript ES6 modules, HTML5, CSS3
- **Dependencies**: None (intentionally dependency-free)
- **Data Storage**: Browser localStorage for progress tracking
- **Content**: Static HTML file (`data/part91.html`) with 1.5MB of regulation text
- **Assets**: SVG images for aviation symbols in `assets/` folder

### Project Structure
```
BFR/
├── index.html              # Main app entry point
├── styles.css              # Application styles  
├── src/
│   ├── main.js            # Main application logic (~800 lines)
│   └── state.js           # State management and localStorage
├── data/
│   └── part91.html        # FAR Part 91 regulations (1.5MB)
├── assets/
│   ├── sectional/         # Aviation chart symbols (SVG)
│   ├── runway/           # Runway marking symbols (SVG)
│   └── *.pdf             # Reference documents
├── scripts/
│   └── fetch_assets.py   # Asset download utility
└── .github/
    └── copilot-instructions.md  # This file
```

### Key Code Files
- **`src/main.js`**: Contains all UI components, routing, and application logic
- **`src/state.js`**: Manages localStorage persistence and state initialization
- **`data/part91.html`**: Pre-parsed FAR Part 91 regulations with section IDs
- **`index.html`**: Single-page application shell with navigation

## Common Development Tasks

### Making Code Changes
1. **ALWAYS** start the development server first using commands above
2. Edit files directly - no compilation needed
3. Refresh browser to see changes instantly
4. **Validate immediately**: Test affected functionality in the browser
5. Check browser console for any JavaScript errors

### Debugging Issues
- **Application not loading**: Check browser console for JavaScript errors
- **Sections not displaying**: Verify `data/part91.html` file exists and is accessible
- **Assets missing**: Run `python3 scripts/fetch_assets.py` or check `assets/` folder
- **Progress not saving**: Check browser's localStorage permissions
- **Search not working**: Verify section ID parsing in `StudyView()` function

### Testing Changes
**NEVER SKIP** these validation steps after making changes:
1. Start development server
2. Load application in browser
3. Test the specific feature you modified
4. Test at least one complete user workflow:
   - Study a section → mark as read → take flashcards → take quiz → check progress
5. Verify no console errors appear
6. Test search functionality with various terms

### Code Style Guidelines
- **Vanilla JavaScript**: No frameworks - use standard DOM APIs
- **ES6 modules**: Use `import`/`export` syntax
- **Functional approach**: Prefer pure functions where possible
- **Minimal dependencies**: Do not add external libraries without strong justification
- **Accessibility**: Maintain keyboard navigation and screen reader support

## Validation Scenarios

### Complete User Workflow Test
After any changes, execute this full scenario:
1. **Study**: Search for "91.103", open section, mark as read
2. **Flashcards**: Complete 2-3 cards using both "knew it" and "didn't know"
3. **Quiz**: Take a quiz, answer questions, verify feedback
4. **Progress**: Check that study/flashcard progress is tracked
5. **Assets**: Verify "About & Sources" shows all assets as "OK"

### Performance Expectations
- **Server startup**: 1-2 seconds (Python) or instant (Node.js after install)
- **App loading**: Under 3 seconds on modern browsers
- **Section search**: Instant filtering of 200+ sections
- **Navigation**: Instant switching between Study/Flashcards/Quiz/About/Progress
- **Data persistence**: Progress saves immediately to localStorage

## Important Notes

### What Works
- ✅ Both Python and Node.js development servers
- ✅ All application features (Study, Flashcards, Quiz, Progress)
- ✅ Asset loading and validation
- ✅ Real-time search and filtering
- ✅ Progress tracking and export/import
- ✅ Responsive design and keyboard navigation

### Development Constraints
- **No build process**: Direct file editing only
- **No package manager**: Dependencies would require manual integration
- **Static content**: FAR Part 91 content is pre-processed into `data/part91.html`
- **Browser storage**: All progress data stored in localStorage only
- **Asset dependency**: Some features require SVG assets in `assets/` folder

### Emergency Recovery
If the application stops working:
1. Check browser console for JavaScript errors
2. Verify `data/part91.html` file exists and is not corrupted
3. Clear browser localStorage: `localStorage.clear()` in console
4. Restart development server
5. Test with different browser if issues persist

### Performance Notes
- Large content file (1.5MB) loads once at startup
- Search is performed client-side across all 200+ sections
- Assets are lazy-loaded and cached by browser
- localStorage usage is minimal (< 10KB for progress data)

Fixes #28.