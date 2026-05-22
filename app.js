const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

const STORAGE_KEY = "nexocash-state-v1";

const defaultState = {
  incomes: [
    { id: crypto.randomUUID(), reference: "REF-ING-001", name: "Salario mensual", amount: 3600000 },
    { id: crypto.randomUUID(), reference: "REF-ING-014", name: "Freelance UI", amount: 850000 },
    { id: crypto.randomUUID(), reference: "REF-ING-022", name: "Rendimientos", amount: 400000 }
  ],
  expenses: [
    { id: crypto.randomUUID(), reference: "REF-GAS-031", name: "Arriendo", amount: 1650000 },
    { id: crypto.randomUUID(), reference: "REF-GAS-045", name: "Mercado", amount: 1170000 },
    { id: crypto.randomUUID(), reference: "REF-GAS-063", name: "Viaje", amount: 1420000 },
    { id: crypto.randomUUID(), reference: "REF-GAS-060", name: "Servicios", amount: 820000 }
  ]
};

let state = loadState();

const elements = {
  incomeForm: document.querySelector("#income-form"),
  expenseForm: document.querySelector("#expense-form"),
  incomeList: document.querySelector("#income-list"),
  expenseList: document.querySelector("#expense-list"),
  totalIncome: document.querySelector("#total-income"),
  totalExpenses: document.querySelector("#total-expenses"),
  usagePercent: document.querySelector("#usage-percent"),
  incomeHeadingTotal: document.querySelector("#income-heading-total"),
  expenseHeadingTotal: document.querySelector("#expense-heading-total"),
  heroBalance: document.querySelector("#hero-balance"),
  summaryIncome: document.querySelector("#summary-income"),
  summaryExpenses: document.querySelector("#summary-expenses"),
  summaryBalance: document.querySelector("#summary-balance"),
  largestExpense: document.querySelector("#largest-expense"),
  usageBar: document.querySelector("#usage-bar"),
  alertCard: document.querySelector("#alert-card"),
  alertStatus: document.querySelector("#alert-status"),
  alertTitle: document.querySelector("#alert-title"),
  alertMessage: document.querySelector("#alert-message"),
  chart: document.querySelector("#monthly-chart"),
  navButtons: document.querySelectorAll(".nav-button")
};

elements.incomeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addEntry("incomes", event.currentTarget);
});

elements.expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addEntry("expenses", event.currentTarget);
});

elements.incomeList.addEventListener("click", handleDelete);
elements.expenseList.addEventListener("click", handleDelete);

elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(`#${button.dataset.target}`).scrollIntoView({ behavior: "smooth", block: "start" });
    elements.navButtons.forEach((item) => item.classList.toggle("is-active", item === button));
  });
});

window.addEventListener("resize", () => drawChart(getTotals()));

render();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      incomes: Array.isArray(parsed.incomes) ? parsed.incomes : defaultState.incomes,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : defaultState.expenses
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addEntry(collection, form) {
  const formData = new FormData(form);
  const amount = Number(formData.get("amount"));

  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  state[collection].push({
    id: crypto.randomUUID(),
    reference: String(formData.get("reference")).trim(),
    name: String(formData.get("name")).trim(),
    amount
  });

  form.reset();
  saveState();
  render();
}

function handleDelete(event) {
  const button = event.target.closest("[data-delete-id]");

  if (!button) {
    return;
  }

  const collection = button.dataset.collection;
  state[collection] = state[collection].filter((entry) => entry.id !== button.dataset.deleteId);
  saveState();
  render();
}

function render() {
  const totals = getTotals();

  renderList(elements.incomeList, state.incomes, "incomes");
  renderList(elements.expenseList, state.expenses, "expenses");
  renderSummary(totals);
  renderAlert(totals);
  drawChart(totals);
}

function renderList(list, entries, collection) {
  list.replaceChildren();

  if (!entries.length) {
    const empty = document.createElement("li");
    empty.className = "empty-row";
    empty.textContent = collection === "incomes" ? "Sin ingresos registrados" : "Sin gastos registrados";
    list.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <span></span>
      <em></em>
      <strong></strong>
      <button class="delete-entry" type="button" aria-label="Eliminar registro">x</button>
    `;

    item.querySelector("span").textContent = entry.name;
    item.querySelector("em").textContent = entry.reference;
    item.querySelector("strong").textContent = currency.format(entry.amount);

    const deleteButton = item.querySelector("button");
    deleteButton.dataset.collection = collection;
    deleteButton.dataset.deleteId = entry.id;

    list.append(item);
  });
}

function renderSummary({ totalIncome, totalExpenses, balance, usage }) {
  const largestExpense = state.expenses.reduce((largest, item) => {
    return item.amount > largest.amount ? item : largest;
  }, { name: "Sin gastos", amount: 0 });

  elements.totalIncome.textContent = currency.format(totalIncome);
  elements.totalExpenses.textContent = currency.format(totalExpenses);
  elements.usagePercent.textContent = `${Math.round(usage)}%`;
  elements.incomeHeadingTotal.textContent = currency.format(totalIncome);
  elements.expenseHeadingTotal.textContent = currency.format(totalExpenses);
  elements.heroBalance.textContent = currency.format(balance);
  elements.summaryIncome.textContent = currency.format(totalIncome);
  elements.summaryExpenses.textContent = currency.format(totalExpenses);
  elements.summaryBalance.textContent = currency.format(balance);
  elements.largestExpense.textContent = largestExpense.amount ? largestExpense.name : "Sin gastos";
  elements.usageBar.style.width = `${Math.min(usage, 100)}%`;

  elements.heroBalance.classList.toggle("is-negative", balance < 0);
  elements.heroBalance.classList.toggle("is-positive", balance >= 0);
  elements.summaryBalance.classList.toggle("is-negative", balance < 0);
  elements.summaryBalance.classList.toggle("is-positive", balance >= 0);
}

function renderAlert({ totalIncome, totalExpenses, balance, usage }) {
  elements.alertCard.classList.remove("is-warning", "is-danger");

  if (totalIncome === 0 && totalExpenses === 0) {
    elements.alertStatus.textContent = "Alarma activa";
    elements.alertTitle.textContent = "Agrega tus movimientos";
    elements.alertMessage.textContent = "Registra ingresos y gastos para ver el estado real del mes.";
    return;
  }

  if (balance < 0) {
    elements.alertCard.classList.add("is-danger");
    elements.alertStatus.textContent = "Alarma critica";
    elements.alertTitle.textContent = "Gastos superan ingresos";
    elements.alertMessage.textContent = `El gasto mensual esta ${currency.format(Math.abs(balance))} por encima del ingreso registrado.`;
    return;
  }

  if (usage >= 90) {
    elements.alertCard.classList.add("is-warning");
    elements.alertStatus.textContent = "Alarma preventiva";
    elements.alertTitle.textContent = `Gastos al ${Math.round(usage)}% del ingreso`;
    elements.alertMessage.textContent = "Estas cerca del limite mensual. Conviene pausar compras no esenciales.";
    return;
  }

  elements.alertStatus.textContent = "Alarma saludable";
  elements.alertTitle.textContent = "Presupuesto bajo control";
  elements.alertMessage.textContent = `Aun tienes ${currency.format(totalIncome - totalExpenses)} disponibles este mes.`;
}

function drawChart({ totalIncome, totalExpenses, balance }) {
  const canvas = elements.chart;
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(320, Math.floor(rect.width));
  const height = 320;

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const data = [
    { label: "Ingresos", value: totalIncome, color: "#6cf2d5" },
    { label: "Gastos", value: totalExpenses, color: "#ff5a6a" },
    { label: "Balance", value: Math.abs(balance), color: balance < 0 ? "#ff5a6a" : "#4ade80" }
  ];
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const padding = 34;
  const chartHeight = height - 94;
  const slot = (width - padding * 2) / data.length;

  context.fillStyle = "#101827";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#2f3a50";
  context.lineWidth = 1;
  for (let index = 0; index < 4; index += 1) {
    const y = padding + (chartHeight / 3) * index;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  data.forEach((item, index) => {
    const barWidth = Math.min(96, slot * 0.42);
    const barHeight = Math.max(8, (item.value / maxValue) * chartHeight);
    const x = padding + slot * index + slot / 2 - barWidth / 2;
    const y = padding + chartHeight - barHeight;

    context.fillStyle = item.color;
    context.fillRect(x, y, barWidth, barHeight);

    context.fillStyle = "#f6f8fb";
    context.font = "700 13px Arial";
    context.textAlign = "center";
    context.fillText(item.label, x + barWidth / 2, height - 38);

    context.fillStyle = "#9eacc2";
    context.font = "12px Arial";
    context.fillText(shortCurrency(item.value), x + barWidth / 2, y - 10);
  });
}

function getTotals() {
  const totalIncome = sum(state.incomes);
  const totalExpenses = sum(state.expenses);
  const balance = totalIncome - totalExpenses;
  const usage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : totalExpenses > 0 ? 100 : 0;

  return { totalIncome, totalExpenses, balance, usage };
}

function sum(entries) {
  return entries.reduce((total, entry) => total + Number(entry.amount), 0);
}

function shortCurrency(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }

  return currency.format(value);
}
