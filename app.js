// Города: координаты на условной карте (x, y в viewBox 400x260) и расстояние от Москвы, км
const CITIES = {
  "Москва":            { x: 110, y: 120, km: 0 },
  "Санкт-Петербург":   { x: 80,  y: 60,  km: 710 },
  "Нижний Новгород":   { x: 150, y: 118, km: 420 },
  "Казань":            { x: 190, y: 125, km: 820 },
  "Екатеринбург":      { x: 255, y: 110, km: 1790 },
  "Новосибирск":       { x: 340, y: 130, km: 3300 },
  "Ростов-на-Дону":    { x: 105, y: 205, km: 1070 },
  "Краснодар":         { x: 95,  y: 225, km: 1350 },
  "Воронеж":           { x: 110, y: 168, km: 520 },
  "Самара":            { x: 200, y: 155, km: 1060 },
  "Уфа":               { x: 235, y: 140, km: 1350 },
  "Пермь":             { x: 235, y: 95,  km: 1430 },
  "Тюмень":            { x: 285, y: 105, km: 2130 },
  "Челябинск":         { x: 265, y: 130, km: 1780 },
  "Минск":             { x: 55,  y: 115, km: 720 },
};

const RATES = { gazel: 32, "5t": 38, "10t": 48, fura: 62 }; // ₽/км
const CAPACITY = { gazel: 1.5, "5t": 5, "10t": 10, fura: 20 };
const MIN = { gazel: 3500, "5t": 6000, "10t": 9000, fura: 14000 };

const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.round(n).toLocaleString("ru-RU") + " ₽";

// --- nav
const nav = $("#nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 20), { passive: true });
$("#burger").addEventListener("click", () => nav.classList.toggle("open"));
document.querySelectorAll("#menu a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

// --- calculator
$("#cities").innerHTML = Object.keys(CITIES).map((c) => `<option value="${c}">`).join("");
let vehicle = "fura";

function distance(a, b) {
  const A = CITIES[a], B = CITIES[b];
  if (!A || !B) return null;
  if (a === "Москва") return B.km;
  if (b === "Москва") return A.km;
  // грубая оценка через условные координаты
  return Math.round(Math.hypot(A.x - B.x, A.y - B.y) * 13.5);
}

function autoVehicle(w) {
  return Object.keys(CAPACITY).find((k) => CAPACITY[k] >= w) || "fura";
}

function calc() {
  const from = $("#from").value.trim(), to = $("#to").value.trim();
  const w = parseFloat($("#weight").value) || 0;
  if (w > CAPACITY[vehicle]) {
    vehicle = autoVehicle(w);
    syncSeg();
  }
  let km = distance(from, to);
  const sum = $("#sum"), label = $("#distLabel");
  if (from && to && from === to) km = 40; // по городу
  if (km == null) {
    sum.textContent = "по запросу";
    label.textContent = "Направление рассчитает менеджер";
    return;
  }
  let price = Math.max(MIN[vehicle], km * RATES[vehicle]);
  if ($("#ref").checked) price *= 1.25;
  const days = Math.max(1, Math.ceil(km / 650));
  sum.textContent = fmt(Math.round(price / 100) * 100);
  label.textContent = `≈ ${km.toLocaleString("ru-RU")} км · ${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"} в пути`;
}

function syncSeg() {
  document.querySelectorAll("#vehicle button").forEach((b) => b.classList.toggle("on", b.dataset.v === vehicle));
}
document.querySelectorAll("#vehicle button").forEach((b) =>
  b.addEventListener("click", () => {
    vehicle = b.dataset.v;
    const w = $("#weight");
    if (parseFloat(w.value) > CAPACITY[vehicle]) w.value = CAPACITY[vehicle];
    syncSeg();
    calc();
  })
);
["#from", "#to", "#weight", "#ref"].forEach((s) => $(s).addEventListener("input", calc));
calc();

$("#toOrder").addEventListener("click", () => {
  const veh = document.querySelector("#vehicle .on").textContent;
  $("#msg").value = `${$("#from").value} → ${$("#to").value}, ${veh}, ${$("#weight").value} т${$("#ref").checked ? ", реф" : ""}. Расчёт: ${$("#sum").textContent}`;
});

// --- map
const map = $("#map");
const msk = CITIES["Москва"];
let svg = "";
for (const [name, c] of Object.entries(CITIES)) {
  if (name !== "Москва") {
    const mx = (msk.x + c.x) / 2, my = Math.min(msk.y, c.y) - 30;
    svg += `<path class="arc" d="M${msk.x},${msk.y} Q${mx},${my} ${c.x},${c.y}"/>`;
  }
}
for (const [name, c] of Object.entries(CITIES)) {
  const big = name === "Москва";
  svg += `<circle cx="${c.x}" cy="${c.y}" r="${big ? 18 : 8}" fill="url(#g)"/>`;
  svg += `<circle cx="${c.x}" cy="${c.y}" r="${big ? 4.5 : 2.5}" fill="${big ? "#ff5a1f" : "#fff"}"/>`;
  svg += `<text x="${c.x + 6}" y="${c.y - 6}">${name}</text>`;
}
map.insertAdjacentHTML("beforeend", svg);
$("#cityTags").innerHTML = Object.keys(CITIES).map((c) => `<span>${c}</span>`).join("");

// --- counters + reveal
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add("in");
    e.target.querySelectorAll?.("[data-count]").forEach(countUp);
    io.unobserve(e.target);
  }
}, { threshold: 0.15 });

function countUp(el) {
  const end = +el.dataset.count, t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / 1400);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

document.querySelectorAll(".svc, .truck-card, .steps li, .reviews figure, details, .head").forEach((el) => {
  el.classList.add("reveal");
  io.observe(el);
});
io.observe(document.querySelector(".stats"));

// --- phone mask
$("#phone").addEventListener("input", (e) => {
  let d = e.target.value.replace(/\D/g, "").replace(/^[78]/, "").slice(0, 10);
  const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)];
  e.target.value = "+7" + (p[0] ? ` (${p[0]}` : "") + (p[1] ? `) ${p[1]}` : "") + (p[2] ? `-${p[2]}` : "") + (p[3] ? `-${p[3]}` : "");
});

// --- lead form (демо: без бэкенда)
$("#leadForm").addEventListener("submit", (e) => {
  e.preventDefault();
  $("#ok").hidden = false;
  e.target.querySelector("button").disabled = true;
});
