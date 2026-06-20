(() => {
  const { project, stages, events, people, categoryLabels } = window.CalendarData;
  const params = new URLSearchParams(location.search);
  const event = events.find(x => x.id === params.get('id'));
  const content = document.querySelector('#detailContent');
  const sidebar = document.querySelector('#detailSidebar');
  const findPerson = id => people.find(p => p.id === id);
  const stage = event && stages.find(s => s.id === event.stageId);
  const label = type => categoryLabels[type] || type;
  const months = ['януари','февруари','март','април','май','юни','юли','август','септември','октомври','ноември','декември'];
  const formatDate = e => e.datePrecision === 'exact' ? new Intl.DateTimeFormat('bg-BG',{day:'numeric',month:'long',year:'numeric'}).format(new Date(e.date+'T12:00:00')) : (e.datePrecision === 'month' ? `${months[Number(e.date.slice(5,7))-1]} ${e.date.slice(0,4)} г. (месечен ориентир)` : `${e.date.slice(0,4)} г. (годишен ориентир)`);
  const initials = name => name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('');

  if (!event) {
    content.innerHTML = `<div class="not-found"><p class="eyebrow">Няма такава страница</p><h1>Събитието не е намерено.</h1><p>Върни се към хронологията и избери дата от календара.</p><a class="text-link" href="index.html#timeline">Към всички събития <span>→</span></a></div>`;
    sidebar.innerHTML = '';
    return;
  }

  document.title = `${event.title} | ${project.title}`;
  const heroGallery = galleryHTML(event);
  const persons = event.participants.map(id => findPerson(id)).filter(Boolean).map(p => `
    <article class="person-chip">
      ${p.image ? `<img src="${p.image}" alt="${p.imageAlt || ('Изображение, свързано с ' + p.name)}">` : `<span class="portrait-placeholder" aria-label="Няма надеждно изображение">${initials(p.name)}</span>`}
      <div><b>${p.name}</b><span>${p.role}</span></div>
    </article>`).join('');
  const isFocus = stage.focusEvent === event.id;
  const focusBlock = isFocus ? `<section class="detail-section"><p class="eyebrow">Основен акцент на ${stage.number}</p><h2>${stage.focusLabel}</h2><p>${stage.accentText}</p><div class="detail-info-grid"><article class="info-card"><h3>Защо е важно</h3><p>${stage.importance}</p></article><article class="info-card"><h3>Място в развитието</h3><p>${stage.phase} · ${stage.period}. Това е водещата дата за етапа.</p></article></div>${stage.quotePerson ? quoteBlock(findPerson(stage.quotePerson)) : ''}</section>` : '';
  content.innerHTML = `
    <div class="crumb"><a href="index.html#timeline">Календар</a><span>›</span><span>${stage.number} · ${stage.phase}</span></div>
    <div class="detail-kicker"><span class="tag ${event.type}">${label(event.type)}</span><span>${formatDate(event)}</span><span>·</span><span>${event.place}</span></div>
    <h1 class="detail-title">${event.title}</h1><p class="detail-intro">${event.summary}</p>${heroGallery}
    <div class="detail-info-grid"><article class="info-card"><h3>Защо е важно</h3><p>${event.why}</p></article><article class="info-card"><h3>Регионална връзка</h3><p>${event.regionLink}</p></article></div>
    ${focusBlock}
    <section class="detail-section"><p class="eyebrow">Личности</p><h2>Хората зад датата</h2><div class="person-list">${persons || '<p>За тази дата е посочено събитие, а не конкретна личност.</p>'}</div></section>
    <section class="detail-section"><p class="eyebrow">Ресурс</p><div class="source-box"><h3>Източник за проверка</h3><p>Използван за кратката учебна справка: <strong>${event.sourceLabel}</strong>.</p><a href="${event.sourceUrl}" target="_blank" rel="noopener">Отвори източника в нов раздел ↗</a></div></section>`;
  sidebar.innerHTML = `<section class="sidebar-card">${calendarHTML(event)}</section><section class="sidebar-card"><p class="eyebrow">Свързани дати</p><h2>В същия етап</h2><div class="related-list">${events.filter(x=>x.stageId===event.stageId && x.id!==event.id).slice(0,5).map(x=>`<a class="related-link" href="event.html?id=${x.id}"><span>${formatDate(x)}</span><b>${x.title}</b></a>`).join('')}</div></section>`;

  function galleryHTML(e) {
    const items = (e.gallery && e.gallery.length ? e.gallery : (e.image ? [{ src: e.image, alt: e.imageAlt || ('Изображение към ' + e.title), caption: 'Изображение към събитието' }] : [])).slice(0, 3);
    if (!items.length) return '';
    const cards = items.map((item, index) => `
      <figure class="gallery-item gallery-item--${index + 1} ${item.fit === 'contain' ? 'is-contain' : ''}" style="--object-position:${item.position || 'center'}">
        <img src="${item.src}" alt="${item.alt || 'Изображение към събитието'}" decoding="async">
        ${item.caption ? `<figcaption>${item.caption}</figcaption>` : ''}
      </figure>`).join('');
    return `<section class="event-visuals" aria-label="Снимки към събитието">
      <div class="event-visuals-heading"><p class="eyebrow">Снимки към събитието</p><span>${items.length === 1 ? '1 изображение' : `${items.length} свързани изображения`}</span></div>
      <div class="event-gallery event-gallery--${items.length}">${cards}</div>
      <p class="gallery-note">Изображенията показват мястото, паметника или музейната експозиция, свързани със събитието.</p>
    </section>`;
  }

  function quoteBlock(person) {
    if (!person || !person.quote) return '';
    const source = person.quoteSource ? `<p class="quote-source">Източник за цитата: <a href="${person.quoteSource}" target="_blank" rel="noopener">${person.quoteSourceLabel || 'Отвори източника ↗'}</a></p>` : '';
    return `<div class="quote-box"><blockquote>${person.quote}</blockquote><p><strong>Пояснение:</strong> ${person.quoteExplanation}</p>${source}</div>`;
  }
  function calendarHTML(e){
    const y = Number(e.date.slice(0,4)); const m = Number(e.date.slice(5,7))-1; const day = e.datePrecision==='exact'?Number(e.date.slice(8,10)):1;
    const first = new Date(y,m,1).getDay(); const offset=(first+6)%7; const days=new Date(y,m+1,0).getDate();
    let cells=''; for(let i=0;i<offset;i++) cells+='<span class="calendar-day empty"></span>';
    for(let d=1;d<=days;d++) cells+=`<span class="calendar-day ${d===day?'active':''}">${d}</span>`;
    return `<p class="eyebrow">Дата в календара</p><div class="calendar-head"><strong>${months[m]} ${y}</strong><span>${e.datePrecision==='exact'?'точна дата':'ориентир'}</span></div><div class="weekdays"><span>П</span><span>В</span><span>С</span><span>Ч</span><span>П</span><span>С</span><span>Н</span></div><div class="days-grid">${cells}</div><p class="calendar-note">${e.datePrecision==='exact'?'Маркиран е денят на събитието.':'Източникът посочва само година или месец; календарът маркира ориентировъчна позиция.'}</p>`;
  }
})();
