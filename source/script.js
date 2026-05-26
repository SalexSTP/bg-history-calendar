const monthNames = [
  "Януари", "Февруари", "Март", "Април", "Май", "Юни",
  "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"
];

const weekdayNames = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const state = {
  events: [],
  people: new Map(),
  selectedEventId: null,
  currentMonth: null,
  currentYear: null,
  personModal: null,
  eventTypeFilter: ""
};

const elements = {
  eventDetails: document.getElementById("eventDetails"),
  calendarTitle: document.getElementById("calendarTitle"),
  calendarGrid: document.getElementById("calendarGrid"),
  calendarWeekdays: document.getElementById("calendarWeekdays"),
  monthSelect: document.getElementById("monthSelect"),
  yearSelect: document.getElementById("yearSelect"),
  eventTypeFilter: document.getElementById("eventTypeFilter"),
  prevMonthBtn: document.getElementById("prevMonthBtn"),
  nextMonthBtn: document.getElementById("nextMonthBtn"),
  eventCount: document.getElementById("eventCount"),
  personCount: document.getElementById("personCount"),
  personModalBody: document.getElementById("personModalBody"),
  personModalTitle: document.getElementById("personModalTitle")
};

async function init() {
  renderWeekdays();

  try {
    const [eventsResponse, peopleResponse] = await Promise.all([
      fetch("./data/events.json"),
      fetch("./data/people.json")
    ]);

    const events = await eventsResponse.json();
    const people = await peopleResponse.json();

    state.events = events.sort((a, b) => a.date.localeCompare(b.date));
    state.people = new Map(people.map((person) => [person.id, person]));
    state.personModal = new bootstrap.Modal(document.getElementById("personModal"));

    const firstEvent = state.events[0];
    const initialDate = firstEvent ? new Date(firstEvent.date) : new Date();

    state.selectedEventId = firstEvent?.id || null;
    state.currentMonth = initialDate.getMonth();
    state.currentYear = initialDate.getFullYear();

    populateYearOptions();
    populateMonthOptions();
    syncControls();
    renderCalendar();
    renderSelectedEvent();
    bindEvents();

    elements.eventCount.textContent = String(state.events.length);
    elements.personCount.textContent = String(state.people.size);
  } catch (error) {
    elements.eventDetails.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__label">Грешка</span>
        <h2>Данните не успяха да се заредят</h2>
        <p>Провери дали JSON файловете са валидни и дали сайтът се стартира през локален сървър.</p>
      </div>
    `;
    console.error("Неуспешно зареждане на данни:", error);
  }
}

function bindEvents() {
  elements.prevMonthBtn.addEventListener("click", () => navigateEvent(-1));
  elements.nextMonthBtn.addEventListener("click", () => navigateEvent(1));

  elements.monthSelect.addEventListener("change", (event) => {
    state.currentMonth = Number(event.target.value);
    selectFirstEventForVisibleMonth();
    syncControls();
    renderCalendar();
    renderSelectedEvent();
  });

  elements.yearSelect.addEventListener("change", (event) => {
    state.currentYear = Number(event.target.value);
    populateMonthOptions();
    selectFirstEventForVisibleYear();
    syncControls();
    renderCalendar();
    renderSelectedEvent();
  });

  elements.eventTypeFilter.addEventListener("change", (event) => {
    state.eventTypeFilter = event.target.value;
    populateYearOptions();
    selectFirstEventForVisibleYear();
    populateMonthOptions();
    selectFirstEventForVisibleMonth();
    syncControls();
    renderCalendar();
    renderSelectedEvent();
  });
}

function renderWeekdays() {
  elements.calendarWeekdays.innerHTML = weekdayNames
    .map((day) => `<div class="calendar-weekday">${day}</div>`)
    .join("");
}

function populateYearOptions() {
  const years = getAvailableYears();
  elements.yearSelect.innerHTML = years
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
}

function populateMonthOptions() {
  const months = getAvailableMonthsForYear(state.currentYear);

  if (!months.includes(state.currentMonth)) {
    state.currentMonth = months[0] ?? 0;
  }

  elements.monthSelect.innerHTML = months
    .map((monthIndex) => `<option value="${monthIndex}">${monthNames[monthIndex]}</option>`)
    .join("");
}

function getFilteredEvents() {
  if (!state.eventTypeFilter) {
    return state.events;
  }
  return state.events.filter((event) => event.type === state.eventTypeFilter);
}

function renderCalendar() {
  const firstDay = new Date(state.currentYear, state.currentMonth, 1);
  const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7;

  const filteredEvents = getFilteredEvents();
  const eventMap = new Map();
  filteredEvents.forEach((event) => {
    if (!eventMap.has(event.date)) eventMap.set(event.date, []);
    eventMap.get(event.date).push(event);
  });
  elements.calendarTitle.textContent = `${monthNames[state.currentMonth]} ${state.currentYear}`;
  elements.calendarGrid.innerHTML = "";

  for (let i = 0; i < mondayBasedOffset; i += 1) {
    const placeholder = document.createElement("div");
    placeholder.className = "calendar-day--placeholder";
    elements.calendarGrid.appendChild(placeholder);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = formatDateKey(state.currentYear, state.currentMonth, day);
    const eventsForDay = eventMap.get(dateKey) || [];
    const button = document.createElement("button");
    const isSelected = eventsForDay.some((e) => e.id === state.selectedEventId);

    let className = `calendar-day${eventsForDay.length ? " calendar-day--active" : ""}${isSelected ? " calendar-day--selected" : ""}`;
    if (eventsForDay[0] && eventsForDay[0].type) {
      className += ` calendar-day--type-${eventsForDay[0].type}`;
    }

    button.type = "button";
    button.className = className;
    button.disabled = eventsForDay.length === 0;
    button.innerHTML = `
      <span class="calendar-day__number">${day}</span>
      ${eventsForDay.length ? '<span class="calendar-day__dot"></span>' : ""}
    `;

    if (eventsForDay.length) {
      button.title = eventsForDay.map((e) => e.title).join("; ");
      button.addEventListener("click", () => {
        state.selectedEventId = eventsForDay[0].id;
        syncStateToSelectedEvent();
        syncControls();
        renderCalendar();
        renderSelectedEvent();
      });
    }

    elements.calendarGrid.appendChild(button);
  }
}

function renderSelectedEvent() {
  const event = getSelectedEvent();

  if (!event) {
    elements.eventDetails.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__label">Няма избрано събитие</span>
        <h2>Тази дата още няма съдържание</h2>
        <p>Избери друга активна дата, за да видиш примерната визия на детайлния панел.</p>
      </div>
    `;
    return;
  }

  const participants = event.participants
    .map((id) => state.people.get(id))
    .filter(Boolean);

  elements.eventDetails.innerHTML = `
    <div class="details-head">
      <div>
        <span class="details-date">${formatLongDate(event.date)}</span>
        <h2 class="details-title">${event.title}</h2>
        <div class="details-place">${event.place}</div>
      </div>
      <div class="importance-chip">${event.importance}</div>
    </div>

    <div class="summary-card">
      <p>${event.summary}</p>
    </div>

    <section class="event-section">
      <h3 class="section-title">Защо е важна тази дата</h3>
      <p>${event.significance}</p>
    </section>

    <section class="event-section">
      <h3 class="section-title">Главни участници</h3>
      <div class="participants-grid">
        ${participants.map(renderParticipantCard).join("")}
      </div>
    </section>

    <section class="event-section">
      <h3 class="section-title">Материал</h3>
      <div class="gallery-grid">
        ${event.gallery.map(renderGalleryCard).join("")}
      </div>
    </section>
  `;

  document.querySelectorAll("[data-person-id]").forEach((button) => {
    button.addEventListener("click", () => openPersonModal(button.dataset.personId));
  });
}

function renderParticipantCard(person) {
  return `
    <button type="button" class="participant-card" data-person-id="${person.id}">
      <img src="${person.image}" alt="${person.name}">
      <div>
        <strong>${person.name}</strong>
        <span>${person.role}</span>
      </div>
    </button>
  `;
}

function renderGalleryCard(item) {
  return `
    <figure class="gallery-card">
      <img src="${item.image}" alt="${item.caption}">
      <figcaption>${item.caption}</figcaption>
    </figure>
  `;
}

function openPersonModal(personId) {
  const person = state.people.get(personId);
  if (!person) {
    return;
  }

  elements.personModalTitle.textContent = person.name;
  let quoteHtml = "";
  if (person.quote) {
    quoteHtml = `<blockquote class="person-quote"><em>"${person.quote}"</em></blockquote>`;
  }

  elements.personModalBody.innerHTML = `
    <div class="person-modal-layout">
      <div>
        <h4>${person.name}</h4>
        <div class="person-meta">
          <span>Роден: ${person.birthDate}</span>
          <span>Място: ${person.birthPlace}</span>
        </div>
        <p>${person.description}</p>
        ${quoteHtml}
      </div>
      <div>
        <img class="modal-portrait" src="${person.image}" alt="${person.name}">
      </div>
    </div>
  `;

  state.personModal.show();
}

function navigateEvent(step) {
  const filteredEvents = getFilteredEvents();
  const currentIndex = filteredEvents.findIndex((event) => event.id === state.selectedEventId);
  if (currentIndex === -1) {
    return;
  }

  const nextIndex = currentIndex + step;
  if (nextIndex < 0 || nextIndex >= filteredEvents.length) {
    return;
  }

  state.selectedEventId = filteredEvents[nextIndex].id;
  syncStateToSelectedEvent();
  syncControls();
  renderCalendar();
  renderSelectedEvent();
}

function syncStateToSelectedEvent() {
  const event = getSelectedEvent();
  if (!event) {
    return;
  }

  const date = new Date(event.date);
  state.currentYear = date.getFullYear();
  state.currentMonth = date.getMonth();
  populateMonthOptions();
}

function selectFirstEventForVisibleYear() {
  const filteredEvents = getFilteredEvents();
  const yearEvents = filteredEvents.filter((event) => getEventYear(event) === state.currentYear);
  const selectedStillVisible = yearEvents.some((event) => event.id === state.selectedEventId);

  if (selectedStillVisible) {
    const selectedEvent = state.events.find((e) => e.id === state.selectedEventId);
    const selectedDate = new Date(selectedEvent.date);
    state.currentMonth = selectedDate.getMonth();
    populateMonthOptions();
    return;
  }

  const nextEvent = yearEvents[0];
  if (!nextEvent) {
    return;
  }

  state.selectedEventId = nextEvent.id;
  const nextDate = new Date(nextEvent.date);
  state.currentMonth = nextDate.getMonth();
  populateMonthOptions();
}

function selectFirstEventForVisibleMonth() {
  const filteredEvents = getFilteredEvents();
  const monthEvents = filteredEvents.filter(
    (event) => getEventYear(event) === state.currentYear && getEventMonth(event) === state.currentMonth
  );
  const selectedStillVisible = monthEvents.some((event) => event.id === state.selectedEventId);
  if (selectedStillVisible) {
    return;
  }

  if (monthEvents[0]) {
    state.selectedEventId = monthEvents[0].id;
  }
}

function getAvailableYears() {
  const filteredEvents = getFilteredEvents();
  return [...new Set(filteredEvents.map((event) => getEventYear(event)))];
}

function getAvailableMonthsForYear(year) {
  const filteredEvents = getFilteredEvents();
  return [...new Set(
    filteredEvents
      .filter((event) => getEventYear(event) === year)
      .map((event) => getEventMonth(event))
  )];
}

function getSelectedEvent() {
  return state.events.find((event) => event.id === state.selectedEventId);
}

function getEventYear(event) {
  return new Date(event.date).getFullYear();
}

function getEventMonth(event) {
  return new Date(event.date).getMonth();
}

function syncControls() {
  elements.yearSelect.value = String(state.currentYear);
  elements.monthSelect.value = String(state.currentMonth);
  updateNavButtons();
}

function updateNavButtons() {
  const filteredEvents = getFilteredEvents();
  const currentIndex = filteredEvents.findIndex((event) => event.id === state.selectedEventId);
  elements.prevMonthBtn.disabled = currentIndex <= 0;
  elements.nextMonthBtn.disabled = currentIndex === -1 || currentIndex >= filteredEvents.length - 1;
}

function formatDateKey(year, monthIndex, day) {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function formatLongDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

init();
