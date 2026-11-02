const STORAGE_KEY = "expenseflow_transactions_v1";
const BUDGET_KEY = "expenseflow_monthly_budget";

const COLORS = [
  "#8273e8",
  "#55c7a0",
  "#f2a879",
  "#75a8e8",
  "#e58cbb",
  "#e6c45e",
  "#8d9eae",
  "#a89bf4"
];

const ICONS = {
  "Food & Dining": "🍜",
  "Transport": "🚕",
  "Shopping": "🛍️",
  "Bills": "🧾",
  "Health": "💊",
  "Education": "📚",
  "Entertainment": "🎧",
  "Other": "✦"
};

// Load saved expenses
let expenses = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "[]"
);

// Load saved budget
let budget = Number(
  localStorage.getItem(BUDGET_KEY) || 0
);

const $ = id => document.getElementById(id);

const fmt = n =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

const today = new Date();

$("date").value = localDate(today);


// Date functions
function localDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentMonth() {
  return $("monthSelect").value ||
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  let [y, m] = key.split("-");

  return new Date(+y, +m - 1, 1).toLocaleDateString(
    "en-IN",
    {
      month: "long",
      year: "numeric"
    }
  );
}


// Initialize months
function initMonths() {
  let opts = [];

  for (let i = 0; i < 15; i++) {
    let d = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1
    );

    let key =
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    opts.push(
      `<option value="${key}">${monthLabel(key)}</option>`
    );
  }

  $("monthSelect").innerHTML = opts.join("");
}


// Get expenses for selected month
function monthExpenses() {
  return expenses.filter(e =>
    e.date.startsWith(currentMonth())
  );
}


// Save expenses
function persist() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(expenses)
  );

  render();
}


// Save monthly budget
$("saveBudget").addEventListener("click", () => {

  let inputValue = $("budgetInput").value;

  if (inputValue.trim() === "") {
    showToast("Please enter your monthly budget.");
    return;
  }

  let newBudget = Number(inputValue);

  if (!Number.isFinite(newBudget) || newBudget < 0) {
    showToast("Please enter a valid budget.");
    return;
  }

  budget = newBudget;

  localStorage.setItem(
    BUDGET_KEY,
    String(budget)
  );

  render();

  showToast("Monthly budget updated! ✦");
});


// Main render function
function render() {

  let list = monthExpenses();

  let total = list.reduce(
    (s, e) => s + e.amount,
    0
  );

  let percent = budget > 0
    ? Math.min((total / budget) * 100, 100)
    : 0;

  // Summary cards
  $("totalAmount").textContent = fmt(total);

  $("monthCount").textContent = list.length;

  $("budgetAmount").textContent = fmt(budget);

  $("budgetProgress").style.width = percent + "%";

  $("budgetUsed").textContent =
    (budget > 0
      ? Math.round((total / budget) * 100)
      : 0) + "% used";

  let remaining = budget - total;

  if (budget === 0) {
    $("budgetRemaining").textContent = "Set your budget";
  } else if (remaining >= 0) {
    $("budgetRemaining").textContent =
      fmt(remaining) + " left";
  } else {
    $("budgetRemaining").textContent =
      fmt(Math.abs(remaining)) + " over budget";
  }

  // Daily average
  $("dailyAverage").textContent =
    fmt(total / Math.max(today.getDate(), 1));

  // Donut chart
  $("donutTotal").textContent = fmt(total);

  // Keep saved budget in input
  $("budgetInput").value = budget || "";

  renderChart(list, total);

  renderRows();
}


// Render chart
function renderChart(list, total) {

  let groups = {};

  list.forEach(e => {
    groups[e.category] =
      (groups[e.category] || 0) + e.amount;
  });

  let entries = Object.entries(groups).sort(
    (a, b) => b[1] - a[1]
  );

  let start = 0;

  let parts = entries.map(([cat, val], i) => {

    let end = start + (
      total ? (val / total) * 360 : 0
    );

    let part =
      `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;

    start = end;

    return part;
  });

  $("donut").style.background = parts.length
    ? `conic-gradient(${parts.join(",")})`
    : "conic-gradient(#eeeef5 0deg 360deg)";


  $("legend").innerHTML = entries.length

    ? entries.slice(0, 5).map(([cat, val], i) => {

        return `
          <div class="legend-row">
            <span class="legend-dot"
              style="background:${COLORS[i % COLORS.length]}">
            </span>

            <span>${escapeHtml(cat)}</span>

            <strong>${Math.round(val / total * 100)}%</strong>
          </div>
        `;

      }).join("")

    : `<div class="empty-legend">
         Add expenses to see your breakdown.
       </div>`;
}


// Render transactions
function renderRows() {

  let search = $("search").value.toLowerCase();

  let all = [...expenses]
    .filter(e =>
      e.description.toLowerCase().includes(search) ||
      e.category.toLowerCase().includes(search)
    )
    .sort((a, b) =>
      b.date.localeCompare(a.date) ||
      b.created - a.created
    );


  $("transactionRows").innerHTML = all
    .slice(0, 12)
    .map(e => {

      return `
        <tr>

          <td>
            <div class="transaction-title">

              <span class="category-icon">
                ${ICONS[e.category] || "✦"}
              </span>

              <span>
                ${escapeHtml(e.description || e.category)}
              </span>

            </div>
          </td>

          <td>
            <span class="category-badge">
              ${escapeHtml(e.category)}
            </span>
          </td>

          <td>
            ${new Date(e.date + "T12:00:00").toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
                year: "numeric"
              }
            )}
          </td>

          <td class="amount-cell">
            − ${fmt(e.amount)}
          </td>

          <td>
            <button
              class="delete-btn"
              aria-label="Delete expense"
              data-delete="${e.id}">
              ×
            </button>
          </td>

        </tr>
      `;

    }).join("");


  let has = all.length > 0;

  $("emptyState").style.display =
    has ? "none" : "block";

  document.querySelector(".table-wrap").style.display =
    has ? "block" : "none";
}


// Escape HTML
function escapeHtml(s) {

  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}


// Add expense
$("expenseForm").addEventListener("submit", e => {

  e.preventDefault();

  let amount = Number($("amount").value);

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Please enter a valid amount.");
    return;
  }

  expenses.push({

    id:
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6),

    amount,

    category: $("category").value,

    date: $("date").value,

    description:
      $("description").value.trim() ||
      $("category").value,

    created: Date.now()

  });

  persist();

  $("amount").value = "";

  $("description").value = "";

  showToast("Expense added — nice and mindful! ✦");
});


// Delete transaction
$("transactionRows").addEventListener("click", e => {

  let b = e.target.closest("[data-delete]");

  if (b) {

    expenses = expenses.filter(
      x => x.id !== b.dataset.delete
    );

    persist();

    showToast("Transaction removed.");
  }
});


// Month selection
$("monthSelect").addEventListener("change", render);


// Search transactions
$("search").addEventListener("input", renderRows);


// Export CSV
$("exportBtn").addEventListener("click", () => {

  let rows = [
    ["Date", "Amount", "Category", "Description"],

    ...expenses.map(e => [
      e.date,
      e.amount,
      e.category,
      e.description
    ])
  ];

  let csv = rows.map(r =>
    r.map(v =>
      `"${String(v).replace(/"/g, '""')}"`
    ).join(",")
  ).join("\n");

  let blob = new Blob(
    [csv],
    { type: "text/csv" }
  );

  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");

  a.href = url;

  a.download = "expenseflow-transactions.csv";

  a.click();

  URL.revokeObjectURL(url);

  showToast("CSV export ready.");
});


// Toast notification
function showToast(t) {

  $("toast").textContent = t;

  $("toast").classList.add("show");

  setTimeout(() =>
    $("toast").classList.remove("show"),
    2600
  );
}


// Buttons
$("openForm").addEventListener("click", () =>
  $("amount").focus()
);

$("emptyAdd").addEventListener("click", () =>
  $("amount").focus()
);


// Initialize website
initMonths();

render();
$("saveBudget").addEventListener("click", () => {
  const input = $("budgetInput").value;

  if (input.trim() === "") {
    showToast("Please enter your monthly budget.");
    return;
  }

  const newBudget = Number(input);

  if (!Number.isFinite(newBudget) || newBudget < 0) {
    showToast("Please enter a valid budget.");
    return;
  }

  budget = newBudget;

  localStorage.setItem(BUDGET_KEY, String(budget));

  render();

  showToast("Monthly budget updated! ✦");
});
