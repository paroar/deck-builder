const IMG_REPO =
  "https://raw.githubusercontent.com/cmlenius/gloomhaven-card-browser/images/images/";
const classFiles = [
  "BB",
  "BN",
  "BO",
  "CR",
  "DF",
  "DT",
  "DW",
  "FF",
  "GE",
  "HV",
  "IF",
  "ME",
  "PC",
  "PY",
  "SD",
  "SH",
  "TA",
];
let currentLimit = 0;
let currentClassCards = [];

async function init() {
  const header = document.getElementById("class-selector");

  // 1. Creamos un array de promesas (todas las peticiones inician al mismo tiempo)
  const promises = classFiles.map(async (file) => {
    try {
      const resp = await fetch(`assets/${file}.json`);
      const data = await resp.json();
      return { file, data };
    } catch (e) {
      console.error("Error loading " + file, e);
      return null;
    }
  });

  // 2. Esperamos a que todas terminen
  const results = await Promise.all(promises);

  // 3. Procesamos los resultados para construir la UI
  results.forEach((result, index) => {
    if (!result) return;

    const { data } = result;
    const classId = data.pageProps.searchResults[0].class;

    const btn = document.createElement("div");
    btn.className = "class-icon-btn";
    btn.dataset.id = classId;
    btn.innerHTML = `<img src="${IMG_REPO}${data.pageProps.icon}" title="${classId}">`;
    btn.onclick = () => renderUI(data.pageProps);

    header.appendChild(btn);

    // Renderizar la primera clase por defecto
    if (index === 0) renderUI(data.pageProps);
  });
}

function renderUI(props) {
  const grid = document.getElementById("deck-grid");
  const pool = document.getElementById("pool-list");

  document
    .querySelectorAll(".class-icon-btn")
    .forEach((b) =>
      b.classList.toggle(
        "active",
        b.dataset.id === props.searchResults[0].class
      )
    );

  grid.innerHTML = "";
  pool.innerHTML = "";
  currentLimit = props.cards;
  currentClassCards = props.searchResults
    .filter((c) => c.level > 0)
    .sort((a, b) => a.level - b.level);

  const columns = Math.ceil(currentLimit / 2);
  grid.style.gridTemplateColumns = `repeat(${columns}, var(--card-w))`;
  document.getElementById("class-name").innerText =
    props.searchResults[0].class === "BB"
      ? "BLINKBLADE"
      : props.searchResults[0].name.toUpperCase();

  for (let i = 0; i < currentLimit; i++) grid.appendChild(createSlot());
  currentClassCards.forEach((card) => pool.appendChild(createPoolItem(card)));
  updateCounter();
}

function createPoolItem(cardData) {
  const container = document.createElement("div");
  container.className = "pool-card-container";
  container.dataset.level = cardData.level;
  container.dataset.img = cardData.image;

  const cardEl = document.createElement("div");
  cardEl.className = "card";
  cardEl.id = `card-${Math.random().toString(36).substr(2, 9)}`;
  cardEl.draggable = true;
  cardEl.style.backgroundImage = `url('${IMG_REPO}${cardData.image}')`;
  cardEl.ondragstart = (e) => e.dataTransfer.setData("text", e.target.id);

  container.appendChild(cardEl);
  return container;
}

function createSlot() {
  const slot = document.createElement("div");
  slot.className = "slot";
  slot.ondragover = (e) => {
    e.preventDefault();
    slot.classList.add("drag-over");
  };
  slot.ondragleave = () => slot.classList.remove("drag-over");

  slot.ondrop = (e) => {
    e.preventDefault();
    slot.classList.remove("drag-over");
    const id = e.dataTransfer.getData("text");
    const draggedCard = document.getElementById(id);
    if (!draggedCard) return;

    const sourceSlot = draggedCard.closest(".slot");
    const sourcePoolContainer = draggedCard.closest(".pool-card-container");
    const existingCard = slot.children[0];

    if (existingCard) {
      if (sourceSlot) {
        sourceSlot.appendChild(existingCard);
      } else {
        returnToPool(existingCard);
      }
    }

    slot.appendChild(draggedCard);
    if (sourcePoolContainer) sourcePoolContainer.remove();
    updateCounter();
  };
  return slot;
}

function returnToPool(card) {
  const bgUrl = card.style.backgroundImage.slice(5, -2).replace(IMG_REPO, "");
  const cardData = currentClassCards.find((c) => c.image === bgUrl);

  if (cardData) {
    const pool = document.getElementById("pool-list");
    const newItem = createPoolItem(cardData);
    pool.appendChild(newItem);

    const items = Array.from(pool.children);
    items.sort((a, b) => parseInt(a.dataset.level) - parseInt(b.dataset.level));
    pool.innerHTML = "";
    items.forEach((item) => pool.appendChild(item));
  }
  card.remove();
  updateCounter();
}

function updateCounter() {
  const count = document.querySelectorAll("#deck-grid .card").length;
  document.getElementById(
    "deck-limit"
  ).innerText = `Cards: ${count} / ${currentLimit}`;
}

document.getElementById("pool-sidebar").ondragover = (e) => e.preventDefault();
document.getElementById("pool-sidebar").ondrop = (e) => {
  const id = e.dataTransfer.getData("text");
  const card = document.getElementById(id);
  if (card && card.closest(".slot")) returnToPool(card);
};

init();
