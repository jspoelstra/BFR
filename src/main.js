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
  const { getTopics, calculateTopicProgress, TOPIC_MAP } = await import('./topics.js');
  
  const container = h('div', { class:'grid cols-2' });
  const sidebar = h('div', { class:'panel' });
  const content = h('div', { class:'panel' });

  const searchInput = h('input', { type:'search', placeholder:'Search sections…', style:'width:100%;padding:10px;border-radius:10px;border:1px solid rgba(122,140,170,.2);background:#0e1830;color:#e6edf7;margin:6px 0 10px;' });
  const list = h('div', { class:'grid' });
  const studyContent = h('div', { id:'study-content' }, 'Select a topic or section to begin.');

  // Track current view mode: 'topics' or 'sections'
  let viewMode = state.study.currentTopic ? 'sections' : 'topics';
  let currentTopic = state.study.currentTopic ? TOPIC_MAP[state.study.currentTopic] : null;
  
  // Initialize sidebar based on view mode
  function updateSidebar() {
    sidebar.innerHTML = '';
    
    if (viewMode === 'topics') {
      sidebar.append(
        h('h3', {}, 'Study Topics'),
        h('p', { class:'small' }, 'Choose a topic to explore sections. Progress is tracked automatically.'),
        searchInput
      );
    } else {
      sidebar.append(
        h('div', { class:'flex space-between', style:'margin-bottom: 10px;' },
          h('button', { class:'button', onClick: () => showTopics() }, '← Back to Topics'),
          h('span', { class:'small' }, `${currentTopic?.title || ''}`)
        ),
        h('h3', {}, currentTopic?.title || 'Sections'),
        h('p', { class:'small' }, currentTopic?.description || ''),
        searchInput
      );
    }
    
    sidebar.appendChild(list);
  }

  content.append(
    h('h3', {}, 'Content'),
    studyContent
  );
  container.append(sidebar, content);

  // Fetch and parse HTML source
  let doc;
  try{
    const res = await fetch('/data/part91.html');
    if(!res.ok) throw new Error(`Failed to load Part 91 HTML (${res.status})`);
    const html = await res.text();
    doc = new DOMParser().parseFromString(html, 'text/html');
  }catch(err){
    console.error(err);
    studyContent.textContent = 'Failed to load Part 91 content.';
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

  function showTopics() {
    viewMode = 'topics';
    currentTopic = null;
    state.study.currentTopic = null;
    saveState(state);
    updateSidebar();
    updateList();
    studyContent.innerHTML = '';
    studyContent.appendChild(h('div', { class:'small', style:'text-align: center; padding: 40px; color: #888;' }, 'Select a topic from the left to begin studying.'));
  }

  function showTopic(topic) {
    viewMode = 'sections';
    currentTopic = topic;
    state.study.currentTopic = topic.id;
    state.study.lastTopic = topic.id;
    saveState(state);
    updateSidebar();
    updateList();
    studyContent.innerHTML = '';
    studyContent.appendChild(
      h('div', { class:'card' },
        h('h3', {}, topic.title),
        h('p', {}, topic.description),
        h('p', { class:'small' }, `This topic contains ${topic.sections.length} sections. Select a section from the left to read its content.`)
      )
    );
  }

  function updateList(){
    list.innerHTML = '';
    
    if (viewMode === 'topics') {
      // Show topic cards
      const topics = getTopics();
      const q = (searchInput.value || '').toLowerCase().trim();
      
      if (q) {
        // Global search across all sections with topic grouping
        const matchedSections = keys.filter(k => 
          k.title.toLowerCase().includes(q) || keyText.get(k.id)?.includes(q)
        );
        
        if (matchedSections.length > 0) {
          list.appendChild(h('div', { class:'small', style:'margin-bottom: 10px; color: #888;' }, 
            `Found ${matchedSections.length} sections matching "${q}"`));
          
          // Group results by topic
          const topicGroups = {};
          for (const section of matchedSections) {
            const topic = getTopics().find(t => t.sections.includes(section.id));
            const topicId = topic?.id || 'other';
            if (!topicGroups[topicId]) {
              topicGroups[topicId] = { topic, sections: [] };
            }
            topicGroups[topicId].sections.push(section);
          }
          
          for (const [topicId, group] of Object.entries(topicGroups)) {
            if (group.topic) {
              list.appendChild(h('div', { class:'small', style:'margin: 15px 0 5px; font-weight: 600; color: #ccc;' }, 
                group.topic.title));
            }
            
            for (const section of group.sections) {
              const card = h('div', { class:'card' },
                h('div', { class:'flex space-between' },
                  h('div', {}, 
                    h('strong', {}, section.title), 
                    ' ', 
                    state.progress.studyReadSections[section.id] ? h('span', { class:'badge' }, 'Read') : ''
                  ),
                  h('button', { class:'button', onClick: () => show(section.id) }, 'Open')
                )
              );
              list.appendChild(card);
            }
          }
        } else {
          list.appendChild(h('div', { class:'small' }, 'No sections match your search.'));
        }
      } else {
        // Show topic overview cards
        for (const topic of topics) {
          const progress = calculateTopicProgress(topic, state.progress.studyReadSections);
          
          const card = h('div', { class:'card', style:'cursor: pointer;' },
            h('div', { onClick: () => showTopic(topic) },
              h('div', { class:'flex space-between', style:'margin-bottom: 8px;' },
                h('h4', { style:'margin: 0;' }, topic.title),
                h('span', { class:'small' }, `${progress.read}/${progress.total}`)
              ),
              h('p', { class:'small', style:'margin: 8px 0;' }, topic.description),
              h('div', { class:'flex space-between', style:'align-items: center;' },
                h('div', { 
                  class:'progress-bar',
                  style:`background: #1a2332; border-radius: 10px; height: 6px; overflow: hidden; flex: 1; margin-right: 10px;`
                },
                  h('div', { 
                    style:`background: ${progress.percentage === 100 ? '#22c55e' : '#3b82f6'}; height: 100%; width: ${progress.percentage}%; transition: width 0.3s ease;`
                  })
                ),
                h('span', { class:'small', style:'color: #888;' }, `${progress.percentage}%`)
              )
            )
          );
          list.appendChild(card);
        }
      }
    } else {
      // Show sections for current topic
      const q = (searchInput.value || '').toLowerCase().trim();
      const topicSections = keys.filter(k => currentTopic.sections.includes(k.id));
      const filtered = !q ? topicSections : topicSections.filter(k => 
        k.title.toLowerCase().includes(q) || keyText.get(k.id)?.includes(q)
      );
      
      for(const k of filtered){
        const s = h('div', { class:'card' },
          h('div', { class:'flex space-between' },
            h('div', {}, 
              h('strong', {}, k.title), 
              ' ', 
              state.progress.studyReadSections[k.id] ? h('span', { class:'badge' }, 'Read') : ''
            ),
            h('button', { class:'button', onClick: () => show(k.id) }, 'Open')
          )
        );
        list.appendChild(s);
      }
      
      if(filtered.length === 0){
        list.appendChild(h('div', { class:'small' }, 'No sections match your search.'));
      }
    }
  }

  function show(id){
    const sec = doc.getElementById(id);
    if(!sec){
      studyContent.innerHTML = 'Section not found in data';
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
    
    studyContent.innerHTML = '';
    studyContent.append(
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
  
  // Initialize view
  updateSidebar();
  updateList();
  
  // Restore last state or show default
  if (state.lastStudy && currentTopic?.sections.includes(state.lastStudy)) {
    show(state.lastStudy);
  } else if (!currentTopic && state.study.lastTopic) {
    // Restore last topic if we're in topic view
    const lastTopic = TOPIC_MAP[state.study.lastTopic];
    if (lastTopic) {
      showTopic(lastTopic);
    }
  }
  
  return container;
}

// Flashcards
function FlashcardsView(){
  const decks = getFlashcardDecks();
  let currentDeckId = state.progress.flashcards.currentDeck || Object.keys(decks)[0];
  let currentDeck = decks[currentDeckId];
  let currentCards = [];
  let i = 0;
  let showAnswer = false;

  // Initialize deck progress if not exists
  if (!state.progress.flashcards.decks[currentDeckId]) {
    state.progress.flashcards.decks[currentDeckId] = { seen: 0, correct: 0 };
  }

  const deckSelector = h('select', { 
    value: currentDeckId,
    onChange: (e) => switchDeck(e.target.value)
  });
  
  const scoreLabel = h('span', { class: 'small' });
  const cardHost = h('div', { class: 'card' });
  
  const container = panel('Flashcards',
    h('div', { class: 'flex', style: 'margin-bottom: 12px; align-items: center; gap: 12px;' },
      h('label', { class: 'small' }, 'Deck:'),
      deckSelector,
      scoreLabel
    ),
    h('div', { class:'grid' },
      cardHost,
      h('div', { class:'flex' },
        h('button', { class:'button', onClick: flip }, 'Flip'),
        h('button', { class:'button success', onClick: () => grade(true) }, 'I knew it'),
        h('button', { class:'button', onClick: () => grade(false) }, "Didn't know")
      )
    )
  );

  function initializeDeck() {
    currentDeck = decks[currentDeckId];
    currentCards = getScheduledCards(currentDeckId);
    if (currentCards.length === 0) {
      // If no cards due, show all cards in order
      currentCards = currentDeck.cards.map((_, index) => index);
    }
    i = 0;
    showAnswer = false;
    updateUI();
  }

  function updateUI() {
    // Update deck selector
    deckSelector.innerHTML = '';
    Object.entries(decks).forEach(([id, deck]) => {
      const option = h('option', { value: id }, deck.title);
      if (id === currentDeckId) option.selected = true;
      deckSelector.append(option);
    });

    // Update score
    const deckProgress = state.progress.flashcards.decks[currentDeckId] || { seen: 0, correct: 0 };
    scoreLabel.textContent = `${deckProgress.correct}/${Math.max(1, deckProgress.seen)} correct`;
    
    renderCard();
  }

  function getScheduledCards(deckId) {
    const now = Date.now();
    const scheduledCards = [];
    
    currentDeck.cards.forEach((_, cardIndex) => {
      const cardKey = `${deckId}-${cardIndex}`;
      const schedule = state.progress.flashcards.cardSchedule[cardKey];
      
      if (!schedule || now >= schedule.nextReview) {
        scheduledCards.push(cardIndex);
      }
    });
    
    return scheduledCards;
  }

  function renderCard(){
    if (currentCards.length === 0) {
      cardHost.innerHTML = '';
      cardHost.append(
        h('div', { class: 'small' }, 'No cards due for review'),
        h('h3', {}, 'All caught up!'),
        h('div', {}, 'Come back later or switch to another deck.')
      );
      return;
    }

    const cardIndex = currentCards[i % currentCards.length];
    const c = currentDeck.cards[cardIndex];
    cardHost.innerHTML = '';
    cardHost.append(
      h('div', { class:'small' }, `Card ${i+1}/${currentCards.length} • ${currentDeck.title}`),
      h('h3', {}, showAnswer ? 'Answer' : 'Question'),
      h('div', {}, showAnswer ? c.a : c.q)
    );
  }

  function flip(){ 
    showAnswer = !showAnswer; 
    renderCard(); 
  }

  function grade(correct){
    if (currentCards.length === 0) return;
    
    const cardIndex = currentCards[i % currentCards.length];
    const cardKey = `${currentDeckId}-${cardIndex}`;
    
    // Update deck progress
    if (!state.progress.flashcards.decks[currentDeckId]) {
      state.progress.flashcards.decks[currentDeckId] = { seen: 0, correct: 0 };
    }
    state.progress.flashcards.decks[currentDeckId].seen++;
    if (correct) state.progress.flashcards.decks[currentDeckId].correct++;
    
    // Update global progress for backward compatibility
    state.progress.flashcards.seen++;
    if (correct) state.progress.flashcards.correct++;
    
    // Spaced repetition scheduling
    updateCardSchedule(cardKey, correct);
    
    saveState(state);
    
    // Remove card from current session if correct, or move to next
    if (correct) {
      currentCards.splice(i % currentCards.length, 1);
      if (i >= currentCards.length) i = 0;
    } else {
      i = (i + 1) % currentCards.length;
    }
    
    showAnswer = false;
    updateUI();
  }

  function updateCardSchedule(cardKey, correct) {
    const now = Date.now();
    let schedule = state.progress.flashcards.cardSchedule[cardKey];
    
    if (!schedule) {
      schedule = {
        interval: 1, // days
        easeFactor: 2.5,
        lastReview: now
      };
    }
    
    if (correct) {
      // Increase interval using simple spaced repetition
      schedule.interval = Math.max(1, Math.round(schedule.interval * schedule.easeFactor));
      schedule.easeFactor = Math.min(3.0, schedule.easeFactor + 0.1);
    } else {
      // Reset interval for incorrect answers but don't make it too punishing
      schedule.interval = Math.max(1, Math.round(schedule.interval * 0.5));
      schedule.easeFactor = Math.max(1.3, schedule.easeFactor - 0.2);
    }
    
    schedule.lastReview = now;
    // Add minimum 10 seconds delay for correct answers to prevent immediate re-appearance
    const minDelay = correct ? 10 * 1000 : 0; // 10 seconds for correct, immediate for incorrect
    schedule.nextReview = now + Math.max(minDelay, schedule.interval * 24 * 60 * 60 * 1000);
    
    state.progress.flashcards.cardSchedule[cardKey] = schedule;
  }

  function switchDeck(deckId) {
    currentDeckId = deckId;
    state.progress.flashcards.currentDeck = deckId;
    saveState(state);
    initializeDeck();
  }

  function onKey(e){
    if(location.hash !== '#flashcards') return;
    if(e.key === ' '){ e.preventDefault(); flip(); }
    else if(e.key.toLowerCase() === 'y' || e.key === '1'){ grade(true); }
    else if(e.key.toLowerCase() === 'n' || e.key === '0'){ grade(false); }
  }
  window.addEventListener('keydown', onKey);

  initializeDeck();
  return container;
}

function getFlashcardDecks(){
  return {
    'emergency': {
      title: 'Emergency Procedures',
      cards: [
        { q: 'What authority does the PIC have during an in-flight emergency?', a: 'May deviate from any rule to the extent required (91.3(b)).' },
        { q: 'You encounter unexpected IMC conditions during VFR flight. What authority do you have?', a: 'Authority to deviate from VFR rules to the extent required for safety, including requesting emergency clearance (91.3(b)).' },
        { q: 'During an emergency, are you required to obtain ATC clearance before deviating from regulations?', a: 'No. The PIC may deviate from any rule to the extent required, then report as soon as possible (91.3(b)).' },
        { q: 'Your transponder fails while in Class C airspace. What should you do?', a: 'Request ATC authorization to continue operations or depart the airspace. ATC may authorize deviations for equipment failures (91.215(d)).' },
        { q: 'Engine failure over congested area - can you descend below minimum safe altitude?', a: 'Yes, emergency authority allows deviation from minimum altitude rules when necessary for safety (91.3(b), 91.119).' }
      ]
    },
    'alcohol-drugs': {
      title: 'Alcohol & Drugs',
      cards: [
        { q: 'Minimum time between drinking alcohol and acting as a crewmember?', a: '8 hours, and no BAC ≥ 0.04 (91.17).' },
        { q: 'What is the maximum blood alcohol content for crew members?', a: 'Less than 0.04% BAC (91.17(a)(4)).' },
        { q: 'Can you act as PIC if you had 2 beers 7 hours ago and feel fine?', a: 'No. Must wait at least 8 hours from "bottle to throttle" regardless of how you feel (91.17(a)(1)).' },
        { q: 'You took prescribed medication that affects your performance. Can you fly?', a: 'No. Cannot act as crewmember while using any drug that affects faculties contrary to safety (91.17(a)(2)).' },
        { q: 'What if you refuse an alcohol or drug test after an incident?', a: 'Refusal is grounds for denial or revocation of your certificate, same as a positive test (91.17(c)).' }
      ]
    },
    'preflight': {
      title: 'Preflight Planning',
      cards: [
        { q: 'Preflight info required for any flight?', a: 'Runway lengths; takeoff/landing distances appropriate to the aircraft (91.103(b)).' },
        { q: 'What weather information is required for all flights?', a: 'Current and forecast weather for departure, route, and destination areas (91.103(a)).' },
        { q: 'Planning a 150nm cross-country. What additional info is required?', a: 'Alternatives if flight cannot be completed, fuel requirements, and known traffic delays (91.103(b)).' },
        { q: 'You plan to depart VFR with fuel to reach destination plus 25 minutes. Legal?', a: 'No. Day VFR requires destination fuel plus 30 minutes reserve at normal cruise (91.151(a)).' },
        { q: 'Night VFR fuel requirement is how many minutes reserve?', a: '45 minutes at normal cruise power setting (91.151(b)).' },
        { q: 'What NOTAMs must you check before flight?', a: 'All NOTAMs for departure airport, destination, and planned route of flight (91.103(b)).' }
      ]
    },
    'right-of-way': {
      title: 'Right-of-Way Rules',
      cards: [
        { q: 'Right-of-way when converging (same category)?', a: 'Aircraft to the right has right-of-way (91.113(d)).' },
        { q: 'Who has right-of-way: balloon vs airplane?', a: 'Balloon (91.113(d)(1)).' },
        { q: 'Two aircraft approaching head-on. What should each pilot do?', a: 'Both alter course to the right (91.113(e)).' },
        { q: 'Aircraft being overtaken vs overtaking aircraft - who has right-of-way?', a: 'Aircraft being overtaken has right-of-way. Overtaking aircraft must alter course to the right (91.113(f)).' },
        { q: 'Glider vs airplane in normal operations (not emergency) - who yields?', a: 'Airplane yields to glider (91.113(d)(2)).' },
        { q: 'Aircraft approaching to land vs aircraft on final approach - who has right-of-way?', a: 'Aircraft on final approach has right-of-way, but cannot take advantage to cut in front (91.113(g)).' },
        { q: 'What if an aircraft is in distress?', a: 'Aircraft in distress has right-of-way over all other aircraft (91.113(c)).' }
      ]
    },
    'operations': {
      title: 'General Operations',
      cards: [
        { q: 'Careless or reckless operation prohibition?', a: 'May not operate in a manner that endangers life or property (91.13).' },
        { q: 'Seat belt/shoulder harness requirement for takeoff/landing?', a: 'Approved seat/berth with belt, shoulder harness if installed (91.107).' },
        { q: 'Operating in Class G airport vicinity—turn direction for airplanes?', a: 'Left traffic unless otherwise indicated (91.126(b)(1)).' },
        { q: 'Can passengers move about the cabin during taxi, takeoff, and landing?', a: 'No. Each person must occupy approved seat with safety belt fastened (91.107(a)).' },
        { q: 'When must shoulder harnesses be used?', a: 'During takeoff and landing if installed, unless physically unable (91.107(a)(3)).' },
        { q: 'Can you operate an aircraft with known inoperative equipment?', a: 'Only if permitted by MEL or 91.213(d) inoperative equipment procedures.' },
        { q: 'Formation flight is prohibited except when?', a: 'When by arrangement with the pilot-in-command of each aircraft (91.111).' },
        { q: 'When is dropping objects from aircraft prohibited?', a: 'When it creates hazard to persons or property on the surface (91.15).' }
      ]
    },
    'airspace-speed': {
      title: 'Airspace & Speed',
      cards: [
        { q: 'Max indicated airspeed below 10,000 MSL unless authorized?', a: '250 knots IAS (91.117(a)).' },
        { q: 'Min safe altitude over congested area?', a: '1,000 ft above highest obstacle within 2,000 ft horizontal (91.119(b)).' },
        { q: 'When operating at/above 18,000 MSL, altimeter setting?', a: '29.92" Hg (91.121(a)(2)).' },
        { q: 'Max speed in Class D airspace within 4nm of primary airport?', a: '200 knots IAS at or below 2,500 feet AGL (91.117(b)).' },
        { q: 'Min safe altitude over sparsely populated areas?', a: '500 feet above the surface, except over open water or sparsely populated areas (91.119(c)).' },
        { q: 'Can you fly below 500 feet AGL over sparsely populated areas?', a: 'Yes, if not closer than 500 feet to any person, vessel, vehicle, or structure (91.119(c)).' },
        { q: 'Minimum altitude over Yellowstone National Park?', a: '2,000 feet AGL (91.119 and park regulations).' },
        { q: 'Flying at 12,500 MSL cabin pressure altitude for 45 minutes. Oxygen required?', a: 'Yes. Required crew oxygen above 12,500 feet for more than 30 minutes (91.211(a)(2)).' }
      ]
    },
    'atc': {
      title: 'ATC Communications',
      cards: [
        { q: 'ATC light signal: Steady green (in flight)?', a: 'Cleared to land (91.125).' },
        { q: 'ATC light signal: Flashing green (in flight)?', a: 'Return for landing (to be followed by steady green at proper time) (91.125).' },
        { q: 'ATC light signal: Steady red (in flight)?', a: 'Give way to other aircraft and continue circling (91.125).' },
        { q: 'ATC light signal: Flashing red (in flight)?', a: 'Airport unsafe—do not land (91.125).' },
        { q: 'ATC light signal: Flashing white (in flight)?', a: 'No specific meaning assigned (91.125).' },
        { q: 'Your radio fails at non-towered airport. What do you do?', a: 'Continue normal pattern operations while maintaining vigilant watch for other traffic (91.126(b)).' },
        { q: 'Radio failure in controlled airspace VFR - what are your options?', a: 'Land at nearest suitable airport with available communications or continue if weather permits (91.185).' }
      ]
    },
    'equipment': {
      title: 'Required Equipment',
      cards: [
        { q: 'Required equipment for VFR day flight (acronym ATOMATOFLAMES)?', a: 'Airspeed, Tachometer, Oil pressure, Manifold pressure, Altimeter, Temperature, Oil temp, Fuel gauge, Landing gear position, Anti-collision lights, Magnetic compass, ELT, Safety belts (91.205(b)).' },
        { q: 'Additional equipment required for VFR night flight?', a: 'Position lights, anti-collision light system, landing light (for hire), spare fuses (91.205(c)).' },
        { q: 'When is a transponder required?', a: 'Class A, B, C airspace; above Class C veil; within 30nm of Class B primary; above 10,000 MSL (91.215).' },
        { q: 'ELT inspection/testing requirements?', a: 'Every 12 calendar months; test only during first 5 minutes of hour; limit to 3 audio sweeps (91.207).' },
        { q: 'Your attitude indicator becomes inoperative. Can you fly VFR?', a: 'Only if aircraft has no MEL and equipment can be safely removed/placarded per 91.213(d).' },
        { q: 'What if your magnetic compass is inoperative for day VFR?', a: 'Cannot fly. Magnetic direction indicator is required equipment that cannot be deferred (91.205(b)).' },
        { q: 'ADS-B Out requirement applies to which airspace?', a: 'Same as transponder requirements - Class A, B, C, above 10,000 MSL, etc. (91.225).' }
      ]
    },
    'weather-vis': {
      title: 'Weather & Visibility',
      cards: [
        { q: 'VFR visibility requirement in Class E above 1,200 AGL?', a: '3 statute miles (91.155(a)).' },
        { q: 'VFR cloud clearances in Class E above 1,200 AGL?', a: '500 feet below, 1,000 feet above, 2,000 feet horizontal (91.155(a)).' },
        { q: 'VFR minimums in Class G below 1,200 AGL during day?', a: '1 mile visibility, clear of clouds (91.155(b)).' },
        { q: 'Can you takeoff VFR with a 800-foot overcast?', a: 'No. Need at least 1,000 feet ceiling for VFR operations (basic VFR minimums).' },
        { q: 'Flying VFR at 2,500 MSL in Class G airspace. Visibility and cloud clearances?', a: '1 mile vis, 500 below/1,000 above/2,000 horizontal if above 1,200 AGL (91.155(b)).' },
        { q: 'Special VFR minimum visibility in controlled airspace?', a: '1 statute mile visibility and clear of clouds (91.157).' },
        { q: 'Can you request Special VFR at night?', a: 'Only if pilot and aircraft are IFR qualified and current (91.157(b)).' },
        { q: 'VFR minimums in Class B airspace?', a: '3 statute miles visibility, clear of clouds (91.155(a)).' },
        { q: 'VFR minimums in Class C airspace?', a: '3 statute miles visibility, 500 below/1,000 above/2,000 horizontal cloud clearance (91.155(a)).' },
        { q: 'VFR minimums in Class D airspace?', a: '3 statute miles visibility, 500 below/1,000 above/2,000 horizontal cloud clearance (91.155(a)).' },
        { q: 'Flying at 11,500 MSL in Class G airspace. What are VFR minimums?', a: '5 statute miles visibility, 1,000 above/1,000 below/1 mile horizontal cloud clearance (91.155(b)).' },
        { q: 'You encounter clouds at your altitude while flying VFR. Nearest VFR airport is 50 miles ahead. Legal options?', a: 'Turn around, climb, descend, or deviate to maintain VFR cloud clearances. Cannot enter clouds VFR (91.155).' },
        { q: 'What weather phenomenon requires an immediate 180-degree turn during VFR flight?', a: 'Any condition that prevents maintaining VFR minimums - clouds, precipitation, reduced visibility, etc.' },
        { q: 'METAR shows BKN010. Can you depart VFR?', a: 'No. Broken layer at 1,000 feet prevents meeting minimum ceiling requirements for VFR flight.' },
        { q: 'Can you descend through a thin cloud layer if you can see the ground?', a: 'No. VFR flight must remain clear of clouds at all times (91.155).' }
      ]
    },
    'scenarios': {
      title: 'Real-World Scenarios',
      cards: [
        { q: 'Beautiful sunny day, planning flight to beach. Your passenger brings a cooler with beer. Can they drink during flight?', a: 'No. No person may drink alcohol aboard aircraft (91.17(a)(3)). Only exception is properly served alcohol by certificate holder.' },
        { q: 'Departing for weekend trip, notice slight oil leak during preflight. Weather is severe clear, 20-minute flight. Decision?', a: 'Do not fly. Continuing with known mechanical issues could constitute careless operation (91.13). Have it inspected first.' },
        { q: 'Flying to airshow, ATC clears you "direct to airport, report 10-mile final." Your GPS shows 12 miles. Can you report now?', a: 'No. Must be accurate in position reports. Wait until actually 10 miles from airport before reporting.' },
        { q: 'Perfect weather for night flight to dinner. Landing light burned out during taxi. Can you continue?', a: 'Yes, if not flying for hire. Landing lights only required for night flights "for hire" (91.205(c)(4)).' },
        { q: 'Cross-country flight, 30 miles from destination you see thunderstorms ahead. Fuel shows 20 minutes remaining. Options?', a: 'Divert immediately to nearest airport. You do not have legal fuel reserves (30 min day/45 min night) (91.151).' },
        { q: 'Flying over your house at 1,200 AGL to show family. House is in subdivision. Legal altitude?', a: 'No. Over congested area need 1,000 feet above highest obstacle within 2,000 feet horizontally (91.119(b)).' },
        { q: 'Practicing slow flight, another aircraft appears close off your right wing. Who has right-of-way?', a: 'The other aircraft has right-of-way as it is to your right. You must give way (91.113(d)).' },
        { q: 'Radio fails while taxiing at towered airport. Ground control cannot hear you. What should you do?', a: 'Continue to watch for light gun signals from tower. ATC will use light signals to direct taxi operations (91.125).' },
        { q: 'Planning sunrise departure for photography flight. Calculating civil twilight at 6:30 AM, but weather shows overcast at 1,000 feet. Legal to depart VFR?', a: 'No. Need at least 1,000 foot ceiling for VFR operations. Overcast at 1,000 feet means you cannot maintain VFR cloud clearances.' },
        { q: 'Your instructor wants to practice unusual attitudes under the hood. You\'re not instrument rated. Can you legally act as safety pilot?', a: 'Yes, if qualified in aircraft category/class and occupy seat with adequate vision and controls (91.109(c)).' },
        { q: 'Flying to a fly-in, you see a helicopter approaching from your left at the same altitude. Both of you are converging on the airport. Who yields?', a: 'You yield. Helicopter has right-of-way over airplane in normal operations (91.113(d)(3)).' },
        { q: 'Planned 3-hour cross-country, but 90 minutes into flight your passenger gets airsick and wants to return immediately. Fuel shows 3.5 hours remaining. Decision?', a: 'Return as requested. PIC authority includes passenger comfort and safety. You have adequate fuel reserves (91.3(a)).' },
        { q: 'On approach to non-towered airport, you hear another aircraft call "final" as you turn base. You cannot see them. What should you do?', a: 'Give way and extend your pattern. Aircraft on final approach has right-of-way (91.113(g)).' },
        { q: 'Beautiful day for pattern practice. After 5 touch-and-goes, tower asks you to "make this a full stop, we have traffic." You need 3 more landings for currency. Must you comply?', a: 'Yes. ATC instructions must be followed. You can request to continue after the traffic passes or return later (91.123(b)).' },
        { q: 'Flying over a remote area at 6,500 MSL when engine starts running rough. Nearest airport is 40 miles away. What altitude considerations apply?', a: 'You may descend below minimum safe altitude if required for emergency landing. Emergency authority allows deviation (91.3(b), 91.119).' },
        { q: 'Departing busy Class D airport, ground control clears you to taxi to runway 27 via Alpha. You notice construction blocking Alpha taxiway. What should you do?', a: 'Stop and request alternate taxi route from ground control. Never deviate from taxi clearance without permission (91.129(i)).' }
      ]
    },
    'certificates': {
      title: 'Certificates & Currency',
      cards: [
        { q: 'What documents must you carry as PIC?', a: 'Pilot certificate, medical certificate, and photo ID. Aircraft must have airworthiness certificate, registration, and operating limitations (91.203).' },
        { q: 'To carry passengers, what currency is required?', a: '3 takeoffs and landings within 90 days in same category/class. Night currency requires night landings to full stop (91.57).' },
        { q: 'Your BFR expired 2 months ago. Can you fly solo to practice for checkride?', a: 'No. Cannot act as PIC without current BFR, even solo. Need authorized instructor or BFR before solo flight (91.56).' },
        { q: 'Flight review (BFR) consists of what minimum requirements?', a: '1 hour ground training and 1 hour flight training with authorized instructor within preceding 24 months (91.56).' },
        { q: 'Medical certificate expires in 2 days. Can you exercise pilot privileges after expiration?', a: 'No. Medical certificate must be current to exercise pilot privileges (91.61).' },
        { q: 'High performance aircraft checkout - what is required?', a: 'Ground and flight training from authorized instructor in aircraft with more than 200 HP (91.61(a)(5)).' },
        { q: 'Can you act as safety pilot if your medical certificate expired last month?', a: 'No. Safety pilot must hold at least a current medical certificate appropriate for the flight (91.109(c)).' },
        { q: 'Your night currency expired 3 weeks ago. Can you take passengers on a day flight?', a: 'Yes. Night currency only applies to carrying passengers at night. Day currency is separate (91.57).' },
        { q: 'Complex aircraft checkout requirements for insurance purposes - is this required by FAR?', a: 'No specific FAR requirement, but insurance may require it. Good practice for safety.' },
        { q: 'Can you log PIC time while flying with a CFI who is acting as PIC?', a: 'Only if you are sole manipulator of controls and rated in aircraft category/class (61.51(e)).' }
      ]
    },
    'flight-planning': {
      title: 'Flight Planning & Navigation',
      cards: [
        { q: 'Cross-country flight planning: What constitutes a cross-country flight for private pilot experience?', a: 'Flight with landing more than 50nm straight-line distance from departure point (61.1).' },
        { q: 'Planning flight to airport with only GPS approach. Your aircraft has no GPS. Can you legally fly there?', a: 'Yes, but you must have alternate means of navigation and cannot use the GPS approach (91.205).' },
        { q: 'Your planned route takes you through Class B airspace. What is required?', a: 'ATC clearance and Mode C transponder. Pilot certificate must have specific Class B endorsement if student (91.131).' },
        { q: 'Filing VFR flight plan: When is it required?', a: 'Never required for VFR domestic flights, but highly recommended for safety, especially over remote areas.' },
        { q: 'True course vs magnetic course - which do you use for navigation?', a: 'Magnetic course for navigation. True course is only used for initial calculations and wind triangle.' },
        { q: 'Dead reckoning navigation fails due to stronger headwind than forecast. Legal options?', a: 'Divert to nearest suitable airport, use electronic navigation aids, or contact ATC for assistance.' },
        { q: 'VOR station identified as out of service on NOTAM. Can you still use it for emergency navigation?', a: 'Use with extreme caution. May provide rough guidance but reliability is questionable.' },
        { q: 'Flight following service: Can ATC deny your request for VFR flight following?', a: 'Yes. Flight following is workload permitting and may be denied due to traffic volume.' },
        { q: 'Pilotage navigation over unfamiliar terrain at night. Recommended backup navigation method?', a: 'Electronic navigation (GPS, VOR) essential. Pilotage alone is unreliable at night.' },
        { q: 'Lost procedures: You are unsure of your position in controlled airspace. What should you do?', a: 'Contact ATC immediately, confess your situation, and follow their instructions. Squawk 7700 if emergency.' }
      ]
    }
  };
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

// Progress Chart Generation Functions
function createProgressBar(percentage, width = 200, height = 8) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  
  // Background bar
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', width);
  bg.setAttribute('height', height);
  bg.setAttribute('rx', height / 2);
  bg.setAttribute('fill', 'rgba(122,140,170,0.2)');
  
  // Progress fill
  const fill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  fill.setAttribute('width', Math.max(0, Math.min(100, percentage)) / 100 * width);
  fill.setAttribute('height', height);
  fill.setAttribute('rx', height / 2);
  fill.setAttribute('fill', 'url(#progressGradient)');
  
  // Gradient definition
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'progressGradient');
  
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#58a6ff');
  
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#22c55e');
  
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  
  svg.appendChild(defs);
  svg.appendChild(bg);
  svg.appendChild(fill);
  
  return svg;
}

function createPieChart(correct, total, size = 60) {
  if (total === 0) total = 1; // Avoid division by zero
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  
  const radius = size / 2 - 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Background circle
  const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bgCircle.setAttribute('cx', centerX);
  bgCircle.setAttribute('cy', centerY);
  bgCircle.setAttribute('r', radius);
  bgCircle.setAttribute('fill', 'rgba(122,140,170,0.2)');
  svg.appendChild(bgCircle);
  
  if (correct > 0) {
    const percentage = correct / total;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    
    // Progress arc
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('cx', centerX);
    progressCircle.setAttribute('cy', centerY);
    progressCircle.setAttribute('r', radius);
    progressCircle.setAttribute('fill', 'transparent');
    progressCircle.setAttribute('stroke', '#22c55e');
    progressCircle.setAttribute('stroke-width', '3');
    progressCircle.setAttribute('stroke-dasharray', strokeDasharray);
    progressCircle.setAttribute('stroke-dashoffset', circumference / 4); // Start from top
    progressCircle.setAttribute('transform', `rotate(-90 ${centerX} ${centerY})`);
    svg.appendChild(progressCircle);
  }
  
  // Center text
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', centerX);
  text.setAttribute('y', centerY + 4);
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '12');
  text.setAttribute('fill', '#e6edf7');
  text.textContent = `${Math.round(correct / total * 100)}%`;
  svg.appendChild(text);
  
  return svg;
}

function createBarChart(values, labels, width = 200, height = 60) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  
  const maxValue = Math.max(...values, 1);
  const barWidth = width / values.length * 0.8;
  const barSpacing = width / values.length * 0.2;
  
  values.forEach((value, index) => {
    const barHeight = (value / maxValue) * (height - 20);
    const x = index * (barWidth + barSpacing) + barSpacing / 2;
    const y = height - barHeight - 10;
    
    // Bar
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('x', x);
    bar.setAttribute('y', y);
    bar.setAttribute('width', barWidth);
    bar.setAttribute('height', barHeight);
    bar.setAttribute('fill', index === values.length - 1 ? '#22c55e' : '#58a6ff');
    bar.setAttribute('rx', '2');
    svg.appendChild(bar);
    
    // Value label
    if (value > 0) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + barWidth / 2);
      text.setAttribute('y', y - 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '10');
      text.setAttribute('fill', '#e6edf7');
      text.textContent = value;
      svg.appendChild(text);
    }
  });
  
  return svg;
}

// Progress summary
function ProgressView(){
  const p = state.progress;
  const total = Object.keys(p.studyReadSections).length;
  const estimatedTotalSections = 286; // Total sections in Part 91
  const studyProgress = total > 0 ? (total / estimatedTotalSections) * 100 : 0;
  
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

  // Create progress cards with graphs
  const studyCard = h('div', { class:'card progress-card' },
    h('h3', {}, 'Study'),
    h('div', { class:'progress-stats' },
      h('span', {}, `${total} sections read`),
      h('span', { class:'small' }, `${Math.round(studyProgress)}%`)
    ),
    h('div', { class:'progress-graph' }, createProgressBar(studyProgress))
  );

  const flashcardTotal = Math.max(1, p.flashcards.seen);
  const flashcardAccuracy = flashcardTotal > 0 ? (p.flashcards.correct / flashcardTotal) * 100 : 0;
  const flashcardCard = h('div', { class:'card progress-card' },
    h('h3', {}, 'Flashcards'),
    h('div', { class:'progress-stats' },
      h('span', {}, `${p.flashcards.correct}/${flashcardTotal} correct`),
      h('span', { class:'small' }, `${Math.round(flashcardAccuracy)}%`)
    ),
    h('div', { class:'progress-graph pie-chart' }, createPieChart(p.flashcards.correct, flashcardTotal))
  );

  const quizCard = h('div', { class:'card progress-card' },
    h('h3', {}, 'Quizzes'),
    h('div', { class:'progress-stats' },
      h('span', {}, `Best ${p.quizzes.best}%`),
      h('span', { class:'small' }, `${p.quizzes.attempts} attempts`)
    ),
    h('div', { class:'progress-graph' }, 
      p.quizzes.attempts > 0 ? createProgressBar(p.quizzes.best) : 
      h('div', { class:'small', style:'text-align:center;padding:20px;color:var(--muted)' }, 'No quiz attempts yet')
    )
  );

  const sectionalTotal = Math.max(1, p.sectional.attempts);
  const sectionalAccuracy = sectionalTotal > 0 ? (p.sectional.correct / sectionalTotal) * 100 : 0;
  const sectionalCard = h('div', { class:'card progress-card' },
    h('h3', {}, 'Sectional Symbols'),
    h('div', { class:'progress-stats' },
      h('span', {}, `${p.sectional.correct}/${sectionalTotal} correct`),
      h('span', { class:'small' }, `${Math.round(sectionalAccuracy)}%`)
    ),
    h('div', { class:'progress-graph pie-chart' }, createPieChart(p.sectional.correct, sectionalTotal))
  );

  const runwayTotal = Math.max(1, p.runway.attempts);
  const runwayAccuracy = runwayTotal > 0 ? (p.runway.correct / runwayTotal) * 100 : 0;
  const runwayCard = h('div', { class:'card progress-card' },
    h('h3', {}, 'Runway Markings'),
    h('div', { class:'progress-stats' },
      h('span', {}, `${p.runway.correct}/${runwayTotal} correct`),
      h('span', { class:'small' }, `${Math.round(runwayAccuracy)}%`)
    ),
    h('div', { class:'progress-graph pie-chart' }, createPieChart(p.runway.correct, runwayTotal))
  );

  const dataCard = h('div', { class:'card' },
    h('h3', {}, 'Data'),
    h('div', { class:'flex' }, exportBtn, importBtn, importInput),
    h('button', { class:'button', onClick: resetProgress, style:'margin-top:8px' }, 'Clear Progress')
  );

  return panel('Your Progress', null,
    h('div', { class:'grid cols-3' },
      studyCard,
      flashcardCard,
      quizCard,
      sectionalCard,
      runwayCard,
      dataCard
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
