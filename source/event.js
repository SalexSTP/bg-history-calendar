let events = [];
let people = {};
let eventData = null;

const id = new URLSearchParams(location.search).get("id");

fetch("data/events.json")
  .then(r => r.json())
  .then(data => {
    events = data;

    return fetch("data/people.json");
  })
  .then(r => r.json())
  .then(pData => {
    people = Object.fromEntries(pData.map(p => [p.id, p]));
    init();
  });

function init() {
  const select = document.getElementById("eventSelect");

  select.innerHTML = events.map(e =>
    `<option value="${e.id}">${e.title}</option>`
  ).join("");

  select.addEventListener("change", e => {
    loadEvent(e.target.value);
  });

  loadEvent(id || events[0].id);
}

function loadEvent(eventId) {
  eventData = events.find(e => e.id === eventId);

  document.getElementById("eventSelect").value = eventId;

  renderEvent();
  renderCalendar();
}

function renderEvent() {
  document.getElementById("title").innerText = eventData.title;
  document.getElementById("date").innerText = eventData.date;
  document.getElementById("desc").innerText = eventData.summary;

  document.getElementById("people").innerHTML =
    (eventData.participants || [])
      .map(id => {
        const p = people[id];
        if (!p) return "";
        return `
          <li>
            <img src="${p.image}" width="40">
            ${p.name}
          </li>
        `;
      }).join("");

  document.getElementById("gallery").innerHTML =
    (eventData.gallery || [])
      .map(img => `<img src="${img.image}" width="120">`)
      .join("");
}

function renderCalendar() {
  const cal = document.getElementById("calendar");
  const title = document.getElementById("calTitle");

  const date = new Date(eventData.date);
  const month = date.getMonth();
  const year = date.getFullYear();

  title.innerText = `${month + 1}.${year}`;

  const days = new Date(year, month + 1, 0).getDate();

  cal.innerHTML = "";

  for (let i = 1; i <= days; i++) {
    const isActive = i === date.getDate();

    const div = document.createElement("div");
    div.className = "calendar-day" + (isActive ? " active" : "");
    div.innerText = i;

    div.onclick = () => {
      // optional: future multi-event support
      console.log("clicked day:", i);
    };

    cal.appendChild(div);
  }
}

function goBack() {
  window.location.href = "index.html";
}