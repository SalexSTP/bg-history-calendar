let events = [];

fetch("data/events.json")
  .then(r => r.json())
  .then(data => {
    events = data;
    render();
  });

function render() {
  const timeline = document.getElementById("timeline");

  timeline.innerHTML = "";

  events.forEach((e, i) => {
    const div = document.createElement("div");

    div.className = "event " + (i % 2 === 0 ? "left" : "right");

    div.innerHTML = `
      <h3>${e.title}</h3>
      <p>${e.date}</p>
    `;

    div.onclick = () => {
      window.location.href = "event.html?id=" + e.id;
    };

    timeline.appendChild(div);
  });
}