import { loadState, saveState } from './state.js';

const app = document.getElementById('app');
const state = loadState();

const routes = {
  '#study': StudyView,
  '#flashcards': FlashcardsView,
  '#quiz': QuizView,
  '#about': AboutView,
  '#progress': ProgressView,
};

function setActiveNav(hash){
  document.querySelectorAll('[data-route]').forEach(a=>{
    if(a.getAttribute('href')===hash){ a.classList.add('active'); }
    else{ a.classList.remove('active'); }
  });
}

// Ensure nav clicks always route (some embedded browsers may not dispatch hashchange reliably)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-route]');
  if(!a) return;
  const href = a.getAttribute('href');
  if(href && href.startsWith('#')){
    e.preventDefault();
    if(location.hash !== href){
      location.hash = href;
    }else{
      // If same hash, force re-render (e.g., to reset a view)
      render();
    }
  }
});

window.addEventListener('hashchange', () => {
  state.lastRoute = location.hash || '#study';
  saveState(state);
  render();
});
window.addEventListener('DOMContentLoaded', () => {
  const initial = location.hash || state.lastRoute || '#study';
  if(location.hash !== initial) location.hash = initial;
  // Preload assets for smoother experience
  preloadAssets([
    '/assets/sectional/towered-airport.svg',
    '/assets/sectional/nontowered-airport.svg',
    '/assets/sectional/vor.svg',
    '/assets/sectional/restricted-area.svg',
    '/assets/runway/threshold.svg',
    '/assets/runway/displaced-threshold.svg',
    '/assets/runway/touchdown-zone.svg',
    '/assets/runway/hold-short.svg'
  ]);
  render();
});

async function render(){
  const hash = location.hash || '#study';
  setActiveNav(hash);
  const View = routes[hash] || StudyView;
  app.innerHTML = '';
  try{
    const el = await View();
    app.appendChild(el);
  }catch(err){
    app.appendChild(h('div', { class:'panel' },
      h('h2', {}, 'Error loading view'),
      h('p', { class:'small' }, (err && err.message) ? err.message : String(err))
    ));
    console.error(err);
  }
}

// Utilities
function h(tag, attrs={}, ...children){
  const el = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if(v===true) el.setAttribute(k, '');
    else if(v!==false && v!=null) el.setAttribute(k, v);
  }
  for(const c of children.flat()){
    if(c==null) continue;
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

function panel(title, right, body){
  return h('section', { class:'panel' },
    h('div', { class:'flex space-between' }, h('h2', { class:'section-title' }, title), right||h('span')),
    body
  );
}

// Study View
async function StudyView(){
  const container = h('div', { class:'grid cols-2' });
  const sidebar = h('div', { class:'panel' });
  const content = h('div', { class:'panel' });

  const searchInput = h('input', { type:'search', placeholder:'Search sections…', style:'width:100%;padding:10px;border-radius:10px;border:1px solid rgba(122,140,170,.2);background:#0e1830;color:#e6edf7;margin:6px 0 10px;' });
  sidebar.append(
    h('h3', {}, 'Part 91 Topics'),
    h('p', { class:'small' }, 'Click a section to read. Mark as read to track progress.'),
    searchInput
  );
  const list = h('div', { class:'grid' });
  sidebar.appendChild(list);

  content.append(
    h('h3', {}, 'Content'),
    h('div', { id:'study-content' }, 'Select a section from the left.')
  );

  container.append(sidebar, content);

  // Fetch and parse HTML source (guarded)
  let doc;
  try{
    const res = await fetch('/data/part91.html');
    if(!res.ok) throw new Error(`Failed to load Part 91 HTML (${res.status})`);
    const html = await res.text();
    doc = new DOMParser().parseFromString(html, 'text/html');
  }catch(err){
    console.error(err);
    const target = content.querySelector('#study-content');
    if(target) target.textContent = 'Failed to load Part 91 content.';
    return container;
  }

  // Auto-index all sections from the HTML
  const keys = Array.from(doc.querySelectorAll('div.section[id]')).map(sec => {
    const id = sec.id;
    const h4 = sec.querySelector('h4');
    const text = (h4?.textContent || '').replace(/^§\s*/,'').trim();
    const title = text ? `${id} - ${text}` : id;
    return { id, title };
  });
  if(keys.length === 0){
    // Fallback to a minimal set if parsing failed
    keys.push({ id:'91.3', title:'91.3 - PIC Authority' });
    keys.push({ id:'91.103', title:'91.103 - Preflight Action' });
    keys.push({ id:'91.107', title:'91.107 - Belts & Restraints' });
  }

  // Precompute text for basic search
  const keyText = new Map(keys.map(k => {
    const sec = doc.getElementById(k.id);
    return [k.id, (sec?.textContent || '').toLowerCase()];
  }));

  function markRead(id){
    state.progress.studyReadSections[id] = true;
    saveState(state);
    updateList();
  }

  function updateList(){
    list.innerHTML = '';
    const q = (searchInput.value || '').toLowerCase().trim();
    const filtered = !q ? keys : keys.filter(k => k.title.toLowerCase().includes(q) || keyText.get(k.id)?.includes(q));
    for(const k of filtered){
      const s = h('div', { class:'card' },
        h('div', { class:'flex space-between' },
          h('div', {}, h('strong', {}, k.title), ' ', state.progress.studyReadSections[k.id] ? h('span', { class:'badge' }, 'Read') : ''),
          h('button', { class:'button', onClick: () => show(k.id) }, 'Open')
        )
      );
      list.appendChild(s);
    }
    if(filtered.length===0){
      list.appendChild(h('div', { class:'small' }, 'No sections match your search.'));
    }
  }

  function show(id){
    const sec = doc.getElementById(id);
    const cont = document.getElementById('study-content');
    if(!sec){
      cont.innerHTML = 'Section not found in data';
      return;
    }
    // Extract the section element and a few following siblings until next numbered section id
    const frag = document.createDocumentFragment();
    const clone = sec.cloneNode(true);
    frag.appendChild(clone);
    let sib = sec.nextElementSibling;
    while(sib){
      const sid = sib.id || '';
      if(/^\d+\./.test(sid)) break;
      frag.appendChild(sib.cloneNode(true));
      sib = sib.nextElementSibling;
    }
    cont.innerHTML = '';
    cont.append(
      h('div', { class:'flex space-between' },
        h('div', {}, h('strong', {}, id), ' from Part 91'),
        h('div', {},
          h('button', { class:'button success', onClick: () => markRead(id) }, 'Mark as read')
        )
      ),
      h('div', { class:'card' }, frag)
    );
    state.lastStudy = id;
    saveState(state);
  }

  searchInput.addEventListener('input', updateList);
  updateList();
  if(state.lastStudy){
    show(state.lastStudy);
  }else if(keys.length){
    show(keys[0].id);
  }
  return container;
}

// Flashcards
function FlashcardsView(){
  const cards = getFlashcards();
  let i = 0;
  let showAnswer = false;

  const scoreLabel = h('span', { class:'small' }, `${state.progress.flashcards.correct}/${Math.max(1,state.progress.flashcards.seen)} correct`);
  const cardHost = h('div', { class:'card' });
  const container = panel('Flashcards',
    scoreLabel,
    h('div', { class:'grid' },
      cardHost,
      h('div', { class:'flex' },
        h('button', { class:'button', onClick: flip }, 'Flip'),
        h('button', { class:'button success', onClick: () => grade(true) }, 'I knew it'),
        h('button', { class:'button', onClick: () => grade(false) }, "Didn't know")
      )
    )
  );

  function renderCard(){
    const c = cards[i % cards.length];
    cardHost.innerHTML = '';
    cardHost.append(
      h('div', { class:'small' }, `Card ${i+1}/${cards.length}`),
      h('h3', {}, showAnswer ? 'Answer' : 'Question'),
      h('div', {}, showAnswer ? c.a : c.q)
    );
  }

  function flip(){ showAnswer = !showAnswer; renderCard(); }
  function grade(correct){
    state.progress.flashcards.seen++;
    if(correct) state.progress.flashcards.correct++;
    saveState(state);
    i = (i + (correct ? 1 : 0)) % cards.length; // simple spacing
    showAnswer = false;
    renderCard();
  scoreLabel.textContent = `${state.progress.flashcards.correct}/${Math.max(1,state.progress.flashcards.seen)} correct`;
  }

  function onKey(e){
    if(location.hash !== '#flashcards') return;
    if(e.key === ' '){ e.preventDefault(); flip(); }
    else if(e.key.toLowerCase() === 'y' || e.key === '1'){ grade(true); }
    else if(e.key.toLowerCase() === 'n' || e.key === '0'){ grade(false); }
  }
  window.addEventListener('keydown', onKey);

  renderCard();
  return container;
}

function getFlashcards(){
  return [
    { q: 'What authority does the PIC have during an in-flight emergency?', a: 'May deviate from any rule to the extent required (91.3(b)).' },
    { q: 'Minimum time between drinking alcohol and acting as a crewmember?', a: '8 hours, and no BAC ≥ 0.04 (91.17).' },
    { q: 'Preflight info required for any flight?', a: 'Runway lengths; takeoff/landing distances appropriate to the aircraft (91.103(b)).' },
    { q: 'Right-of-way when converging (same category)?', a: 'Aircraft to the right has right-of-way (91.113(d)).' },
    { q: 'Careless or reckless operation prohibition?', a: 'May not operate in a manner that endangers life or property (91.13).' },
    { q: 'Seat belt/shoulder harness requirement for takeoff/landing?', a: 'Approved seat/berth with belt, shoulder harness if installed (91.107).' },
    { q: 'Max indicated airspeed below 10,000 MSL unless authorized?', a: '250 knots IAS (91.117(a)).' },
    { q: 'Min safe altitude over congested area?', a: '1,000 ft above highest obstacle within 2,000 ft horizontal (91.119(b)).' },
    { q: 'When operating at/above 18,000 MSL, altimeter setting?', a: '29.92" Hg (91.121(a)(2)).' },
    { q: 'ATC light signal: Steady green (in flight)?', a: 'Cleared to land (91.125).' },
    { q: 'Operating in Class G airport vicinity—turn direction for airplanes?', a: 'Left traffic unless otherwise indicated (91.126(b)(1)).' },
    { q: 'Who has right-of-way: balloon vs airplane?', a: 'Balloon (91.113(d)(1)).' },
  ];
}

// Quizzes
function QuizView(){
  const all = getQuizQuestionBank();
  let q = [];
  let idx = 0; let correct = 0; let selected = null; let showFeedback = false;
  let currentChoices = [];

  const controls = h('div', { class:'flex' },
    h('label', { class:'small' }, 'Questions: '),
    h('select', { id:'q-count', style:'margin-right:8px' },
      ['6','8','10','12'].map(n => h('option', { value:n }, n))
    ),
    h('button', { class:'button primary', onClick: start }, 'Start Quiz')
  );

  const container = panel('Part 91 Quiz',
    h('span', { class:'small' }, 'Multiple choice with feedback'),
    h('div', { id:'quiz' }, h('div', { class:'card' },
      h('h3', {}, 'Configure'),
      controls,
      h('p', { class:'small' }, 'Press 1-4 to select, Enter for Next.')
    ))
  );

  function start(){
    const n = parseInt(document.getElementById('q-count').value, 10) || 6;
    q = shuffle([...all]).slice(0, n);
  idx = 0; correct = 0; selected = null; showFeedback = false; currentChoices = [];
    renderQ();
  }

  function renderQ(){
    const root = document.getElementById('quiz');
    root.innerHTML = '';
    if(idx >= q.length){
      const score = Math.round((correct/q.length)*100);
      state.progress.quizzes.attempts++;
      state.progress.quizzes.best = Math.max(state.progress.quizzes.best, score);
      saveState(state);
      root.append(
        h('div', { class:'card' },
          h('h3', {}, `Score: ${score}%`),
          h('p', {}, `Best: ${state.progress.quizzes.best}% • Attempts: ${state.progress.quizzes.attempts}`),
          h('button', { class:'button primary', onClick: start }, 'Restart')
        )
      );
      return;
    }
    const cur = q[idx];
    if(!currentChoices.length){
      currentChoices = shuffle([...cur.choices]);
    }

    const choiceEls = currentChoices.map((c, i) => h('button', {
      class:'button',
      onClick: () => pick(c)
    }, `${i+1}. ${c}`));

    const card = h('div', { class:'card' },
      h('div', { class:'small' }, `Question ${idx+1}/${q.length}`),
      h('h3', {}, cur.text),
      h('div', { class:'grid' }, choiceEls),
      showFeedback ? h('div', {},
        h('p', { class:'small' },
          (selected === cur.answer)
            ? 'Correct!'
            : `Incorrect. Answer: ${cur.answer}${cur.ref ? ` (${cur.ref})` : ''}`
        ),
        cur.explanation ? h('p', { class:'small', style:'margin-top:8px; font-style:italic' }, cur.explanation) : ''
      ) : '',
      showFeedback ? h('button', { class:'button primary', onClick: next }, 'Next (Enter)') : ''
    );
    root.append(card);

    function pick(c){
      if(showFeedback) return;
      selected = c;
      if(c === cur.answer) correct++;
      showFeedback = true;
      renderQ();
    }
  }

  function next(){ selected = null; showFeedback = false; idx++; currentChoices = []; renderQ(); }

  function onKey(e){
    if(location.hash !== '#quiz') return;
    if(!q.length){
      if(e.key === 'Enter') start();
      return;
    }
    if(!showFeedback){
      const map = { '1':0,'2':1,'3':2,'4':3 };
      if(map[e.key] != null){
        const i = map[e.key];
        const c = currentChoices[i];
        if(c != null) {
          // Simulate picking this choice
          selected = c;
          if(c === q[idx].answer) correct++;
          showFeedback = true;
          renderQ();
        }
      }
    }
    if(showFeedback && (e.key === 'Enter')) next();
  }
  window.addEventListener('keydown', onKey);

  // Auto-start a 6-question quiz on entering the route to make it feel active
  setTimeout(() => {
    if(location.hash === '#quiz' && !q.length) start();
  }, 0);

  return container;
}

function getQuizQuestionBank(){
  return [
    { text:'Under 91.3, in an emergency the PIC may:', choices:['Deviate from any rule as required','Must request ATC clearance first','May not deviate under VFR','Only deviate for equipment failures'], answer:'Deviate from any rule as required', ref:'91.3(b)' },
    { text:'91.17 prohibits acting as crewmember when BAC is:', choices:['> 0.08','≥ 0.04','Any detectable amount','≥ 0.02'], answer:'≥ 0.04', ref:'91.17(a)(4)' },
    { text:'91.103 requires preflight knowledge of:', choices:['Alternate airport weather only','NOTAMs only','Runway lengths and performance data','ATC staffing levels'], answer:'Runway lengths and performance data', ref:'91.103(b)' },
    { text:'91.113 right-of-way on head-on:', choices:['Alter left','Climb','Descend','Alter right'], answer:'Alter right', ref:'91.113(e)' },
    { text:'91.107 requires during takeoff/landing:', choices:['Belts optional under 10 minutes','Seat belt and shoulder harness if installed','Only PIC belted','Lap children always allowed'], answer:'Seat belt and shoulder harness if installed', ref:'91.107(a)(3)' },
    { text:'91.111 prohibits:', choices:['Formation with agreement','Operating close creating collision hazard','Night formation','All formation'], answer:'Operating close creating collision hazard', ref:'91.111(a)' },
    { text:'Max IAS below 10,000 ft MSL:', choices:['200 kt','250 kt','230 kt','210 kt'], answer:'250 kt', ref:'91.117(a)' },
    { text:'Within 4 NM of Class D primary airport at/below 2,500 AGL, max IAS unless ATC says otherwise:', choices:['230 kt','200 kt','180 kt','250 kt'], answer:'200 kt', ref:'91.117(b)' },
    { text:'Minimum safe altitude over other than congested areas:', choices:['1,000 ft AGL anywhere','500 ft above surface (and 500 ft from persons/structures)','No limit under Class G','1,500 ft above surface'], answer:'500 ft above surface (and 500 ft from persons/structures)', ref:'91.119(c)' },
    { text:'Altimeter setting to maintain flight level at/above 18,000 MSL:', choices:['28.92"','29.92"','30.00"','30.12"'], answer:'29.92"', ref:'91.121(a)(2)' },
    { text:'ATC light signal steady red in flight means:', choices:['Cleared to land','Give way and continue circling','Return for landing','Airport unsafe—do not land'], answer:'Give way and continue circling', ref:'91.125' },
    { text:'Operating at non-towered Class G airport, airplane turns are:', choices:['Right unless otherwise indicated','Left unless otherwise indicated','Any direction','Based on runway heading only'], answer:'Left unless otherwise indicated', ref:'91.126(b)(1)' },
    
    // Scenario-based questions for realistic pilot decision-making
    { 
      text:'You arrive to depart VFR during the day and discover the magnetic compass is inoperative. Weather is VFR and all other systems are normal. Can you legally fly this aircraft?', 
      choices:['Yes, the compass is not required for VFR day flight','Yes, but only to the nearest repair facility','No, a magnetic direction indicator is required equipment','Yes, if you can navigate by GPS only'], 
      answer:'No, a magnetic direction indicator is required equipment', 
      explanation:'A magnetic direction indicator is required equipment for VFR day flight under §91.205(b). Since it\'s required equipment and inoperative, §91.213(d) relief does not apply unless an MEL authorizes deferral (most small GA aircraft do not have an MEL).', 
      ref:'§91.205(b)(3), §91.213' 
    },
    { 
      text:'You plan to depart VFR at night for a personal flight. During preflight, you discover the landing light is inoperative but all position lights and anti-collision lights work normally. Can you legally depart?', 
      choices:['No, landing lights are always required for night flight','Yes, landing lights are only required for flights for hire at night','No, all lights must be operational for night VFR','Yes, but only if you return before sunrise'], 
      answer:'Yes, landing lights are only required for flights for hire at night', 
      explanation:'Under §91.205(c)(4), landing lights are required for night VFR only when the aircraft is operated for hire. Position lights and anti-collision lights are required for all night VFR operations.', 
      ref:'§91.205(c)(4)' 
    },
    { 
      text:'Your transponder and ADS-B Out equipment becomes inoperative while on the ground at a Class C airport. You need to depart. What are your options?', 
      choices:['You cannot depart from Class C airspace without a transponder','You can depart immediately as long as you stay VFR','You can depart with ATC authorization after making a request','You must taxi to a non-towered airport to depart'], 
      answer:'You can depart with ATC authorization after making a request', 
      explanation:'Both §91.215 and §91.225 allow ATC to authorize deviations for inoperative transponder/ADS-B equipment. You must request authorization in advance, and ATC may approve the operation with specific instructions.', 
      ref:'§91.215(d), §91.225(f)' 
    },
    { 
      text:'You discover your ELT is inoperative during preflight for a local training flight. The aircraft has been operated recently and the ELT worked on the last flight three days ago. Can you fly today?', 
      choices:['No, the ELT must always be operational','Yes, but only to the nearest repair facility','Yes, §91.207 allows temporary operation if properly documented','No, you must install a new ELT before flight'], 
      answer:'Yes, §91.207 allows temporary operation if properly documented', 
      explanation:'§91.207(f) allows operation with an inoperative ELT if the aircraft is being operated for training, ferrying to repair, or other specific purposes, provided proper documentation (placard and logbook entry) is made.', 
      ref:'§91.207(f)' 
    },
    { 
      text:'You\'re planning a VFR cross-country flight departing at 10 AM. Your calculations show you\'ll land at your destination with exactly 25 minutes of fuel remaining. Is this legal for day VFR operations?', 
      choices:['Yes, 25 minutes exceeds the minimum reserve','No, you need at least 30 minutes fuel reserve','Yes, but only if weather remains VFR','No, you need at least 45 minutes fuel reserve'], 
      answer:'No, you need at least 30 minutes fuel reserve', 
      explanation:'§91.151(a) requires aircraft operating under VFR during the day to carry enough fuel to fly to the first point of intended landing and thereafter for at least 30 minutes at normal cruising speed.', 
      ref:'§91.151(a)' 
    },
    { 
      text:'You\'re flying VFR at night and your calculations show you\'ll arrive at your destination with 35 minutes of fuel remaining at normal cruise power. Is this legal?', 
      choices:['Yes, 35 minutes exceeds the night requirement','No, you need at least 45 minutes fuel reserve at night','Yes, the 30-minute rule applies day and night','No, you need at least one hour reserve at night'], 
      answer:'No, you need at least 45 minutes fuel reserve at night', 
      explanation:'§91.151(b) requires aircraft operating under VFR at night to carry enough fuel to fly to the first point of intended landing and thereafter for at least 45 minutes at normal cruising speed.', 
      ref:'§91.151(b)' 
    },
    { 
      text:'Flying over a congested area of a city, what is the minimum safe altitude you must maintain in a single-engine aircraft?', 
      choices:['500 feet above the highest obstacle within 2,000 feet','1,000 feet above the highest obstacle within 2,000 feet horizontally','1,500 feet above the surface','2,000 feet above the surface'], 
      answer:'1,000 feet above the highest obstacle within 2,000 feet horizontally', 
      explanation:'§91.119(b) requires aircraft over congested areas to maintain at least 1,000 feet above the highest obstacle within a horizontal radius of 2,000 feet of the aircraft.', 
      ref:'§91.119(b)' 
    },
    { 
      text:'You\'re conducting pipeline patrol over sparsely populated terrain at 400 feet AGL, staying at least 500 feet horizontally from all structures and people. A person on the ground signals distress. Can you legally descend lower to assist?', 
      choices:['No, you must maintain 500 feet AGL minimum','Yes, emergency situations allow deviation from altitude rules','No, only emergency responders can fly below 500 feet','Yes, but only over water'], 
      answer:'Yes, emergency situations allow deviation from altitude rules', 
      explanation:'§91.3(b) gives the pilot-in-command authority to deviate from any rule when an emergency exists that requires immediate action. Providing assistance in an emergency situation would justify deviation from minimum altitude requirements.', 
      ref:'§91.3(b), §91.119' 
    },
    { 
      text:'During your instrument training, your CFII covers the pitot-static system and notes that the static port is blocked. For VFR flight, which instruments would be affected and is the flight legal?', 
      choices:['Only altimeter affected; flight is legal VFR','Altimeter and airspeed; flight is illegal','Altimeter, airspeed, and VSI; flight depends on other equipment','Only airspeed affected; flight is legal'], 
      answer:'Altimeter, airspeed, and VSI; flight depends on other equipment', 
      explanation:'A blocked static port affects the altimeter, airspeed indicator, and vertical speed indicator. These are all required instruments for VFR flight under §91.205(b), making the flight illegal unless alternate static source procedures can be used.', 
      ref:'§91.205(b)(3)(4)(9)' 
    },
    { 
      text:'You\'re planning to fly from a non-towered airport in Class G airspace to a Class D airport 85 miles away. Your aircraft\'s transponder fails during engine run-up. What are your options?', 
      choices:['Cancel the flight; transponders are always required','Fly to Class D airport; transponders not required in Class G','Contact Class D tower for authorization to enter their airspace','Fly VFR; transponders only required above 10,000 feet'], 
      answer:'Contact Class D tower for authorization to enter their airspace', 
      explanation:'While transponders are not required in most Class G airspace, they are required in Class D airspace under §91.215(b)(2). You must obtain authorization from ATC to operate in Class D airspace without a functioning transponder.', 
      ref:'§91.215(b)(2), §91.215(d)' 
    },
    { 
      text:'During a VFR flight, you encounter unexpected IMC conditions. Your options under §91.3 include all of the following except:', 
      choices:['Request an emergency clearance from ATC','Deviate from VFR altitude requirements to get out of clouds','Continue VFR flight if you have minimum fuel reserves','Turn around immediately to return to VFR conditions'], 
      answer:'Continue VFR flight if you have minimum fuel reserves', 
      explanation:'§91.3(b) allows PIC to deviate from regulations during emergencies, but does not allow continuing VFR flight in IMC conditions. Fuel reserves are irrelevant to the basic prohibition against VFR flight in IMC.', 
      ref:'§91.3(b), §91.155' 
    },
    { 
      text:'Your aircraft\'s position lights fail 30 minutes before sunset. You have a 2-hour VFR flight planned departing in 45 minutes. What should you do?', 
      choices:['Depart immediately before official sunset','Cancel the flight; position lights are required from sunset to sunrise','Depart as planned; position lights only required in actual darkness','Get the lights repaired; they\'re required from sunset to sunrise'], 
      answer:'Get the lights repaired; they\'re required from sunset to sunrise', 
      explanation:'§91.205(c)(1) requires position lights for operations from sunset to sunrise. Since your flight extends past sunset, you must have functioning position lights before departure.', 
      ref:'§91.205(c)(1)' 
    },
    { 
      text:'You\'re flying a rented aircraft and discover a placard stating "INOP - ENGINE DRIVEN VACUUM PUMP - 03/15/24" with a maintenance logbook entry. Today is 03/20/24. The attitude indicator and heading indicator are vacuum-driven. Can you legally fly VFR?', 
      choices:['Yes, if the attitude and heading indicators are turned off','No, these instruments are required for VFR flight','Yes, but only for local flights under 50 miles','Depends on whether the aircraft has an MEL'], 
      answer:'Depends on whether the aircraft has an MEL', 
      explanation:'The attitude indicator and heading indicator are required for VFR flight per §91.205(b). If inoperative, §91.213(d) may allow operation if proper placarding and documentation exist, but only if no MEL exists or the MEL permits deferral.', 
      ref:'§91.205(b)(7)(8), §91.213(d)' 
    },
    { 
      text:'Flying VFR in Class E airspace at 8,500 feet MSL, you encounter visibility that appears to be about 2 miles with scattered clouds 1,500 feet below you. What should you do?', 
      choices:['Continue; you\'re legal with 2 miles visibility in Class E','Descend below the clouds to maintain VFR cloud clearances','Request higher altitude to maintain required visibility','Descend or change course to maintain 3 miles visibility'], 
      answer:'Descend or change course to maintain 3 miles visibility', 
      explanation:'In Class E airspace above 1,200 feet AGL, VFR minimums require 3 statute miles visibility and specific cloud clearances. Two miles visibility is below the legal minimum.', 
      ref:'§91.155(a)' 
    },
    { 
      text:'You\'re conducting touch-and-go practice at a non-towered airport when your radio fails. There are other aircraft in the pattern. What is your best course of action?', 
      choices:['Immediately exit the pattern and land at the nearest towered airport','Continue in the pattern using light gun signals','Continue normal pattern operations while watching for other traffic','Land immediately on the nearest available runway'], 
      answer:'Continue normal pattern operations while watching for other traffic', 
      explanation:'§91.126(b) establishes standard traffic pattern procedures for non-towered airports. Radio communication is not required at non-towered airports, though it\'s highly recommended. Continue normal pattern operations while maintaining vigilant watch for other traffic.', 
      ref:'§91.126(b), §91.113' 
    }
  ];
}

// Sectional Symbols (simple inline SVG quiz)
/* function SectionalView(){
  const symbols = getSectionalSymbols();
  let i = 0; let result = null;

  const container = panel('Sectional Symbol ID',
    h('span', { class:'small' }, `Attempts ${state.progress.sectional.attempts} • Correct ${state.progress.sectional.correct}`),
    h('div', { id:'sec' })
  );

  function renderOne(){
    const root = document.getElementById('sec');
    root.innerHTML = '';
  const s = symbols[i % symbols.length];
    const visual = s.img ? imageOrFallback(s.img, s.svg) : s.svg;
    root.append(h('div', { class:'small' }, 'Loading image…'));
    root.append(
      h('div', { class:'grid cols-2' },
    h('div', { class:'card' }, visual),
        h('div', { class:'card' },
          h('h3', {}, 'What is this?'),
          h('div', { class:'grid' }, s.choices.map(c => h('button', { class:'button', onClick: () => pick(c, s) }, c))),
          result ? h('p', { class:'small' }, result) : ''
        )
      )
    );
  }

  function pick(c, s){
    state.progress.sectional.attempts++;
    if(c===s.answer){ state.progress.sectional.correct++; result = 'Correct!'; }
    else{ result = `Incorrect. Answer: ${s.answer}`; }
    saveState(state);
    i = (i+1) % symbols.length;
    setTimeout(()=>{ result=null; renderOne(); }, 700);
  }

  renderOne();
  return container;
} */

function getSectionalSymbols(){
  // Programmatic SVGs (robust across embed/preview browsers)
  const toweredAirport = {
  svg: makeToweredAirport(),
  img: '/assets/sectional/towered-airport.svg',
    choices: ['Towered airport', 'Non-towered airport', 'Restricted area', 'VOR-DME'],
    answer: 'Towered airport'
  };
  const nontoweredAirport = {
  svg: makeNonToweredAirport(),
  img: '/assets/sectional/nontowered-airport.svg',
    choices: ['Non-towered airport', 'Towered airport', 'Class B shelf', 'NDB'],
    answer: 'Non-towered airport'
  };
  const vor = {
  svg: makeVORSymbol(),
  img: '/assets/sectional/vor.svg',
    choices: ['VOR', 'VORTAC', 'NDB', 'Class D boundary'],
    answer: 'VOR'
  };
  const restricted = {
  svg: makeRestrictedArea(),
  img: '/assets/sectional/restricted-area.svg',
    choices: ['MOA', 'Restricted area', 'Prohibited area', 'Alert area'],
    answer: 'Restricted area'
  };
  return [toweredAirport, nontoweredAirport, vor, restricted];
}

function makeSvg(viewBox='0 0 80 80', w=160, h=160){
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  return svg;
}

function makeToweredAirport(){
  const ns = 'http://www.w3.org/2000/svg';
  const svg = makeSvg();
  const outer = document.createElementNS(ns, 'circle');
  outer.setAttribute('cx','40'); outer.setAttribute('cy','40'); outer.setAttribute('r','18');
  outer.setAttribute('fill','#fff'); outer.setAttribute('stroke','#000'); outer.setAttribute('stroke-width','4');
  const inner = document.createElementNS(ns, 'circle');
  inner.setAttribute('cx','40'); inner.setAttribute('cy','40'); inner.setAttribute('r','6');
  inner.setAttribute('fill','#000');
  svg.appendChild(outer); svg.appendChild(inner);
  return svg;
}

function makeNonToweredAirport(){
  const ns = 'http://www.w3.org/2000/svg';
  const svg = makeSvg();
  const outer = document.createElementNS(ns, 'circle');
  outer.setAttribute('cx','40'); outer.setAttribute('cy','40'); outer.setAttribute('r','18');
  outer.setAttribute('fill','#fff'); outer.setAttribute('stroke','#000'); outer.setAttribute('stroke-width','2'); outer.setAttribute('stroke-dasharray','4 3');
  const inner = document.createElementNS(ns, 'circle');
  inner.setAttribute('cx','40'); inner.setAttribute('cy','40'); inner.setAttribute('r','6');
  inner.setAttribute('fill','#000');
  svg.appendChild(outer); svg.appendChild(inner);
  return svg;
}

function makeVORSymbol(){
  const ns = 'http://www.w3.org/2000/svg';
  const svg = makeSvg();
  const poly = document.createElementNS(ns, 'polygon');
  poly.setAttribute('points','40,10 70,40 40,70 10,40');
  poly.setAttribute('fill','none'); poly.setAttribute('stroke','#6cf'); poly.setAttribute('stroke-width','3');
  svg.appendChild(poly);
  return svg;
}

function makeRestrictedArea(){
  const ns = 'http://www.w3.org/2000/svg';
  const svg = makeSvg();
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x','12'); rect.setAttribute('y','20'); rect.setAttribute('width','56'); rect.setAttribute('height','40');
  rect.setAttribute('fill','none'); rect.setAttribute('stroke','#f59e0b'); rect.setAttribute('stroke-width','3');
  const text = document.createElementNS(ns, 'text');
  text.setAttribute('x','40'); text.setAttribute('y','46'); text.setAttribute('text-anchor','middle'); text.setAttribute('fill','#f59e0b'); text.setAttribute('font-size','14');
  text.textContent = 'R-###';
  svg.appendChild(rect); svg.appendChild(text);
  return svg;
}

// Runway Markings ID
/* function RunwayView(){
  const items = getRunwayItems();
  let i = 0; let result = null;
  const container = panel('Runway Markings',
    h('span', { class:'small' }, `Attempts ${state.progress.runway.attempts} • Correct ${state.progress.runway.correct}`),
    h('div', { id:'rw' })
  );

  function renderOne(){
    const root = document.getElementById('rw');
    root.innerHTML = '';
    const r = items[i % items.length];
  const visual = r.img ? imageOrFallback(r.img, r.svg) : r.svg;
  root.append(h('div', { class:'small' }, 'Loading image…'));
    root.append(
      h('div', { class:'grid cols-2' },
    h('div', { class:'card' }, visual),
        h('div', { class:'card' },
          h('h3', {}, 'Identify the marking'),
          r.choices.map(c => h('button', { class:'button', onClick: () => pick(c, r) }, c)),
          result ? h('p', { class:'small' }, result) : ''
        )
      )
    );
  }

  function pick(c, r){
    state.progress.runway.attempts++;
    if(c===r.answer){ state.progress.runway.correct++; result = 'Correct!'; }
    else{ result = `Incorrect. Answer: ${r.answer}`; }
    saveState(state);
    i = (i+1) % items.length;
    setTimeout(()=>{ result=null; renderOne(); }, 700);
  }

  renderOne();
  return container;
} */

function getRunwayItems(){
  const threshold = { svg: runwaySvg('threshold'), img:'/assets/runway/threshold.svg', choices:['Runway threshold','Touchdown zone','Displaced threshold','Hold short lines'], answer:'Runway threshold' };
  const displaced = { svg: runwaySvg('displaced'), img:'/assets/runway/displaced-threshold.svg', choices:['Displaced threshold','Runway threshold','Taxiway centerline','ILS critical area'], answer:'Displaced threshold' };
  const touchdown = { svg: runwaySvg('tdz'), img:'/assets/runway/touchdown-zone.svg', choices:['Touchdown zone','Aim point','Runway shoulder','Closed runway'], answer:'Touchdown zone' };
  const holdshort = { svg: runwaySvg('hold'), img:'/assets/runway/hold-short.svg', choices:['Hold short lines','Vehicle roadway','Runway edge','Taxiway edge'], answer:'Hold short lines' };
  return [threshold, displaced, touchdown, holdshort];
}

function runwaySvg(kind){
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 300 120');
  svg.setAttribute('width','300');
  svg.setAttribute('height','120');
  svg.innerHTML = `
    <rect x="0" y="0" width="300" height="120" fill="#222"/>
    <rect x="20" y="10" width="260" height="100" fill="#333" stroke="#777" />
  `;
  const ns = 'http://www.w3.org/2000/svg';
  const g = document.createElementNS(ns,'g');
  if(kind==='threshold'){
    for(let i=0;i<8;i++){
      const r = document.createElementNS(ns,'rect');
      r.setAttribute('x', String(30 + i*20));
      r.setAttribute('y','15');
      r.setAttribute('width','10');
      r.setAttribute('height','30');
      r.setAttribute('fill','#fff');
      g.appendChild(r);
    }
  } else if(kind==='displaced'){
    // Arrow heads pointing to displaced threshold bar
    for(let i=0;i<6;i++){
      const y = 60 + (i-3)*12;
      const p = document.createElementNS(ns,'polygon');
      p.setAttribute('points', `40,${y} 70,${y-6} 70,${y+6}`);
      p.setAttribute('fill','#fff');
      g.appendChild(p);
    }
    const bar = document.createElementNS(ns,'rect');
    bar.setAttribute('x','90'); bar.setAttribute('y','15'); bar.setAttribute('width','6'); bar.setAttribute('height','90'); bar.setAttribute('fill','#fff');
    g.appendChild(bar);
  } else if(kind==='tdz'){
    for(let i=0;i<3;i++){
      const left = document.createElementNS(ns,'rect');
      left.setAttribute('x', String(110)); left.setAttribute('y', String(25 + i*20));
      left.setAttribute('width','30'); left.setAttribute('height','6'); left.setAttribute('fill','#fff');
      const right = document.createElementNS(ns,'rect');
      right.setAttribute('x', String(160)); right.setAttribute('y', String(25 + i*20));
      right.setAttribute('width','30'); right.setAttribute('height','6'); right.setAttribute('fill','#fff');
      g.appendChild(left); g.appendChild(right);
    }
  } else if(kind==='hold'){
    const dbl = document.createElementNS(ns,'rect');
    dbl.setAttribute('x','180'); dbl.setAttribute('y','50'); dbl.setAttribute('width','4'); dbl.setAttribute('height','40'); dbl.setAttribute('fill','#fff');
    const dash = document.createElementNS(ns,'rect');
    dash.setAttribute('x','195'); dash.setAttribute('y','50'); dash.setAttribute('width','4'); dash.setAttribute('height','40'); dash.setAttribute('fill','#ff0');
    const dash2 = document.createElementNS(ns,'rect');
    dash2.setAttribute('x','205'); dash2.setAttribute('y','50'); dash2.setAttribute('width','4'); dash2.setAttribute('height','40'); dash2.setAttribute('fill','#ff0');
    g.appendChild(dbl); g.appendChild(dash); g.appendChild(dash2);
  }
  svg.appendChild(g);
  return svg;
}

// Progress summary
function ProgressView(){
  const p = state.progress;
  const total = Object.keys(p.studyReadSections).length;
  const exportBtn = h('button', { class:'button', onClick: exportProgress }, 'Export JSON');
  const importInput = h('input', { type:'file', accept:'application/json', style:'display:none' });
  const importBtn = h('button', { class:'button', onClick: () => importInput.click() }, 'Import JSON');
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if(!file) return;
    try{
      const text = await file.text();
      const data = JSON.parse(text);
      if(!data || typeof data !== 'object') throw new Error('Invalid');
      // Basic shape guard
      const merged = { ...loadState(), ...data };
      saveState(merged);
      alert('Progress imported. Reloading…');
      location.reload();
    }catch(err){
      alert('Failed to import: ' + (err?.message || String(err)));
    }
  });

  return panel('Your Progress', null,
    h('div', { class:'grid cols-3' },
      h('div', { class:'card' }, h('h3', {}, 'Study'), h('p', {}, `${total} sections marked read`)),
      h('div', { class:'card' }, h('h3', {}, 'Flashcards'), h('p', {}, `${p.flashcards.correct}/${Math.max(1,p.flashcards.seen)} correct`)),
      h('div', { class:'card' }, h('h3', {}, 'Quizzes'), h('p', {}, `Best ${p.quizzes.best}% • Attempts ${p.quizzes.attempts}`)),
      h('div', { class:'card' }, h('h3', {}, 'Sectional Symbols'), h('p', {}, `${p.sectional.correct}/${Math.max(1,p.sectional.attempts)} correct`)),
      h('div', { class:'card' }, h('h3', {}, 'Runway Markings'), h('p', {}, `${p.runway.correct}/${Math.max(1,p.runway.attempts)} correct`)),
      h('div', { class:'card' }, h('h3', {}, 'Data'),
        h('div', { class:'flex' }, exportBtn, importBtn, importInput),
        h('button', { class:'button', onClick: resetProgress, style:'margin-top:8px' }, 'Clear Progress')
      )
    )
  );
}

function resetProgress(){
  localStorage.removeItem('bfr-part91-progress-v1');
  location.reload();
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function exportProgress(){
  const data = loadState();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bfr-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Utility: prefer image if available and loaded; fallback to provided element
function imageOrFallback(src, fallbackEl){
  const img = new Image();
  img.src = src;
  img.alt = '';
  img.style.maxWidth = '100%';
  img.style.borderRadius = '8px';
  let wrapped = h('div');
  img.onload = () => { wrapped.innerHTML=''; wrapped.appendChild(img); };
  img.onerror = () => { wrapped.innerHTML=''; wrapped.appendChild(fallbackEl); };
  // optimistic render: try image first; if cached it will load instantly
  wrapped.appendChild(img);
  // if it fails later, onerror replaces with fallback
  return wrapped;
}

function preloadAssets(urls){
  urls.forEach(u => {
    const img = new Image();
    img.src = u;
  });
}

// About & Sources page
function AboutView(){
  const list = h('ul', {},
    h('li', {}, 'FAA Aeronautical Chart Users’ Guide (June 12, 2025): ', link('https://www.faa.gov/air_traffic/flight_info/aeronav/digital_products/aero_guide/')),
    h('li', {}, 'FAA Runway Safety Publications: ', link('https://www.faa.gov/airports/runway_safety/publications')),
    h('li', {}, 'Local reference PDFs (downloaded by script): ',
      h('div', {},
        link('/assets/FAA_Aeronautical_Chart_Users_Guide_20250612.pdf'), ' • ',
        link('/assets/FAA_Airport_Signs_Markings_Lights.pdf')
      )
    ),
    h('li', {}, 'Image assets are local training visuals; replace with official images anytime via assets folder.')
  );
  return panel('About & Sources', null,
    h('div', { class:'grid' },
      h('div', { class:'card' },
        h('h3', {}, 'Sources and Attribution'),
        list
      ),
      h('div', { class:'card' },
        h('h3', {}, 'Asset Status'),
        assetStatusList()
      )
    )
  );
}

function link(href, text){
  const a = document.createElement('a');
  a.href = href; a.textContent = text || href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.style.color = 'var(--brand)';
  return a;
}

function assetStatusList(){
  const items = [
    '/assets/sectional/towered-airport.svg',
    '/assets/sectional/nontowered-airport.svg',
    '/assets/sectional/vor.svg',
    '/assets/sectional/restricted-area.svg',
    '/assets/runway/threshold.svg',
    '/assets/runway/displaced-threshold.svg',
    '/assets/runway/touchdown-zone.svg',
    '/assets/runway/hold-short.svg'
  ];
  const ul = document.createElement('ul');
  items.forEach(src => {
    const li = document.createElement('li');
    li.textContent = src + ' - checking…';
    const img = new Image();
    img.onload = () => li.textContent = src + ' - OK';
    img.onerror = () => li.textContent = src + ' - missing (using fallback)';
    img.src = src;
    ul.appendChild(li);
  });
  return ul;
}
