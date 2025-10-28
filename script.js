const expenseForm = document.getElementById("expenseForm");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("date");
const expensesTbody = document.getElementById("expensesTbody");
const totalAmountEl = document.getElementById("totalAmount");
const countEntriesEl = document.getElementById("countEntries");
const filterCategory = document.getElementById("filterCategory");
const filterMonth = document.getElementById("filterMonth");
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const resetBtn = document.getElementById("resetBtn");
const importBtn = document.getElementById("importBtn");
const fileInput = document.getElementById("fileInput");

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];

function saveToLocalStorage() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

function formatCurrency(value) {
  return "₹" + Number(value).toFixed(2);
}

function generateId() {
  return Date.now().toString();
}

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const expense = {
    id: generateId(),
    amount: parseFloat(amountInput.value),
    category: categoryInput.value,
    description: descriptionInput.value.trim(),
    date: dateInput.value,
  };
  expenses.push(expense);
  saveToLocalStorage();
  renderExpenses();
  updateSummary();
  updateChart();
  expenseForm.reset();
});

function renderExpenses(filtered = expenses) {
  expensesTbody.innerHTML = "";
  if (filtered.length === 0) {
    expensesTbody.innerHTML =
      '<tr><td colspan="5" class="muted" style="text-align:center">No expenses found</td></tr>';
    return;
  }
  filtered.forEach((exp) => {
    const tr = document.createElement("tr");
    tr.classList.add("fade-in");
    tr.innerHTML = `
      <td>${formatCurrency(exp.amount)}</td>
      <td>${exp.category}</td>
      <td>${exp.description || "-"}</td>
      <td>${exp.date}</td>
      <td style="text-align:right" class="actions">
        <button title="Edit" onclick="editExpense('${exp.id}')">✏️</button>
        <button title="Delete" onclick="deleteExpense('${exp.id}')">🗑️</button>
      </td>
    `;
    expensesTbody.appendChild(tr);
  });
}

function deleteExpense(id) {
  expenses = expenses.filter((exp) => exp.id !== id);
  saveToLocalStorage();
  renderExpenses();
  updateSummary();
  updateChart();
}

function editExpense(id) {
  const exp = expenses.find((e) => e.id === id);
  if (!exp) return;
  amountInput.value = exp.amount;
  categoryInput.value = exp.category;
  descriptionInput.value = exp.description;
  dateInput.value = exp.date;
  deleteExpense(id);
}

function updateSummary() {
  const total = expenses.reduce((acc, cur) => acc + cur.amount, 0);
  totalAmountEl.textContent = formatCurrency(total);
  countEntriesEl.textContent = expenses.length;
}

function applyFilters() {
  const cat = filterCategory.value;
  const month = filterMonth.value;
  const query = searchInput.value.toLowerCase();
  let filtered = [...expenses];
  if (cat) filtered = filtered.filter((e) => e.category.includes(cat));
  if (month) filtered = filtered.filter((e) => e.date.startsWith(month));
  if (query)
    filtered = filtered.filter(
      (e) =>
        e.description.toLowerCase().includes(query) ||
        String(e.amount).includes(query)
    );
  renderExpenses(filtered);
}

filterCategory.addEventListener("change", applyFilters);
filterMonth.addEventListener("input", applyFilters);
searchInput.addEventListener("input", applyFilters);
clearBtn.addEventListener("click", () => expenseForm.reset());

exportBtn.addEventListener("click", () => {
  if (expenses.length === 0) return alert("No data to export!");
  let csv = "Amount,Category,Description,Date\n";
  expenses.forEach((e) => {
    csv += `${e.amount},${e.category},"${e.description}",${e.date}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const lines = event.target.result.split("\n").slice(1);
    lines.forEach((line) => {
      const [amount, category, description, date] = line.split(",");
      if (amount && category && date) {
        expenses.push({
          id: generateId(),
          amount: parseFloat(amount),
          category,
          description: description.replace(/"/g, ""),
          date,
        });
      }
    });
    saveToLocalStorage();
    renderExpenses();
    updateSummary();
    updateChart();
  };
  reader.readAsText(file);
});

resetBtn.addEventListener("click", () => {
  if (confirm("Clear all expenses?")) {
    expenses = [];
    saveToLocalStorage();
    renderExpenses();
    updateSummary();
    updateChart();
  }
});

let chart;
function updateChart() {
  const categoryTotals = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const ctx = document.getElementById("pieChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#2563eb",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#ec4899",
            "#14b8a6",
          ],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#374151", boxWidth: 16 },
        },
      },
    },
  });
}

renderExpenses();
updateSummary();
updateChart();
