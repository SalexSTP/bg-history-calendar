(() => {
  const { project, stages, events, people, categoryLabels } = window.CalendarData;
  const $ = (selector) => document.querySelector(selector);
  const stageFilter = $('#stageFilter');
  const categoryButtons = [...document.querySelectorAll('.category-button')];
  const searchInput = $('#searchInput');
  const clearSearch = $('#clearSearch');
  const stack = $('#eventsStack');
  const summary = $('#resultSummary');
  let activeCategory = 'all';

  $('#eventCount').textContent = events.length;
  $('#conclusionText').textContent = project.conclusion;
  document.title = project.title;

  stages.forEach((stage) => {
    const opt = document.createElement('option');
    opt.value = stage.id;
    opt.textContent = `${stage.number}: ${stage.phase}`;
    stageFilter.appendChild(opt);
  });

  const personName = (id) => (people.find((person) => person.id === id) || {}).name || '';
  const label = (type) => categoryLabels[type] || type;
  const year = (event) => event.date.slice(0, 4);
  const dateHint = (event) => event.datePrecision === 'exact'
    ? new Intl.DateTimeFormat('bg-BG', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${event.date}T12:00:00`))
    : (event.datePrecision === 'month' ? `${event.date.slice(0, 4)} г. · месец` : `${year(event)} г. · година`);

  function renderStages() {
    $('#stageCards').innerHTML = stages.map((stage) => {
      const count = events.filter((event) => event.stageId === stage.id).length;
      return `<article class="stage-card"><div class="stage-top"><span>${stage.number} · ${stage.phase}</span><span class="period">${stage.period}</span></div><h3>${stage.title}</h3><p>${count} дати, включително основния акцент</p><a href="event.html?id=${stage.focusEvent}">Отвори основния акцент →</a></article>`;
    }).join('');
  }

  function categoryMatches(event) {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'education-culture') return event.type === 'education' || event.type === 'culture';
    return event.type === activeCategory;
  }

  function filtered() {
    const query = searchInput.value.trim().toLocaleLowerCase('bg');
    return events.filter((event) => {
      const names = event.participants.map(personName).join(' ');
      const searchable = [event.title, event.place, event.short, event.summary, names, label(event.type)].join(' ').toLocaleLowerCase('bg');
      return categoryMatches(event)
        && (stageFilter.value === 'all' || event.stageId === stageFilter.value)
        && (!query || searchable.includes(query));
    });
  }

  function renderEvents() {
    const list = filtered();
    summary.textContent = `${list.length} от ${events.length} събития`;
    stack.innerHTML = list.map((event) => {
      const thumb = event.image ? `<div class="event-thumb-wrap"><img class="event-thumb" src="${event.image}" alt="${event.imageAlt || ('Изображение към ' + event.title)}"></div>` : '';
      return `
      <article class="event-row" data-type="${event.type}">
        <div class="event-date"><b>${year(event)}</b><span>${event.datePrecision === 'exact' ? dateHint(event).replace(/\s+\d{4}$/, '') : event.datePrecision === 'month' ? 'месец' : 'година'}</span></div>
        <span class="event-dot" aria-hidden="true"></span>
        <a class="event-card ${event.image ? 'with-image' : ''}" href="event.html?id=${event.id}" aria-label="Отвори: ${event.title}">
          ${thumb}
          <div><div class="event-meta"><span class="tag ${event.type}">${label(event.type)}</span><span>${event.place}</span></div><h3>${event.title}</h3><p>${event.short}</p></div><span class="event-arrow" aria-hidden="true">→</span>
        </a>
      </article>`;
    }).join('');
  }

  function setCategory(category) {
    activeCategory = category;
    categoryButtons.forEach((button) => {
      const active = button.dataset.category === category;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderEvents();
  }

  categoryButtons.forEach((button) => button.addEventListener('click', () => setCategory(button.dataset.category)));
  stageFilter.addEventListener('change', renderEvents);
  searchInput.addEventListener('input', renderEvents);
  clearSearch.addEventListener('click', () => { searchInput.value = ''; renderEvents(); searchInput.focus(); });

  renderStages();
  renderEvents();
})();
