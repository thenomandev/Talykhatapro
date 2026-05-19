let customers = [];
let currentCustomer = null;
let selectedTxnDate = new Date();
let liveInterval = null;

/* ELEMENTS */
const homeScreen = document.getElementById("homeScreen");
const customerFormScreen = document.getElementById("customerFormScreen");
const ledgerScreen = document.getElementById("ledgerScreen");

const customerList = document.getElementById("customerList");
const customerCount = document.getElementById("customerCount");
const totalReceive = document.getElementById("totalReceive");
const totalGive = document.getElementById("totalGive");
const searchInput = document.getElementById("searchInput");

const openCustomerModal = document.getElementById("openCustomerModal");
const saveCustomerBtn = document.getElementById("saveCustomerBtn");

const customerFormTitle = document.getElementById("customerFormTitle");
const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const customerOpening = document.getElementById("customerOpening");
const openingBalContainer = document.getElementById("openingBalContainer");

const backToHome = document.getElementById("backToHome");
const ledgerAvatar = document.getElementById("ledgerAvatar");
const ledgerName = document.getElementById("ledgerName");
const ledgerBalance = document.getElementById("ledgerBalance");
const ledgerBalanceLabel = document.getElementById("ledgerBalanceLabel");
const ledgerTopBalance = document.getElementById("ledgerTopBalance");

const deleteCustomerBtn = document.getElementById("deleteCustomerBtn");
const threeDotMenu = document.getElementById("threeDotMenu");
const optTagada = document.getElementById("optTagada");
const optReport = document.getElementById("optReport");
const optEdit = document.getElementById("optEdit");
const optDelete = document.getElementById("optDelete");

const txnGive = document.getElementById("txnGive");
const txnReceive = document.getElementById("txnReceive");
const txnNote = document.getElementById("txnNote");
const txnDateBtn = document.getElementById("txnDateBtn");
const txnDate = document.getElementById("txnDate");
const saveTxnBtn = document.getElementById("saveTxnBtn");

const liveTimeCounter = document.getElementById("liveTimeCounter");
const reportViewContainer = document.getElementById("reportViewContainer");
const closeReportBtn = document.getElementById("closeReportBtn");
const reportTxnList = document.getElementById("reportTxnList");
const reportTotalGave = document.getElementById("reportTotalGave");
const reportTotalGot = document.getElementById("reportTotalGot");

const inlineCalculator = document.getElementById("inlineCalculator");
const moneyInputs = document.querySelectorAll(".money-input");
const calcKeys = document.querySelectorAll(".calc-key");

let activeMoneyInput = null;
let calcExpression = "";

/* INIT */
window.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadDashboard();
    updateTxnDateButton();
  } catch (err) {
    console.error(err);
  }
});

async function loadDashboard() {
  customers = await getCustomers();

  for (const cust of customers) {
    const txns = await getTransactions(cust.id);
    cust.computedBalance = calcBalance(cust, txns);
  }

  renderCustomerList(customers);
  updateSummary();
}

function renderCustomerList(list) {
  customerList.innerHTML = "";
  customerCount.textContent = `${formatBanglaNumber(list.length)} / সাপ্লায়ার ০`;

  if (!list.length) {
    customerList.innerHTML =
      `<div style="text-align:center;padding:40px;color:#777;">কোনো গ্রাহক পাওয়া যায়নি</div>`;
    return;
  }

  list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  list.forEach(cust => {
    const bal = cust.computedBalance || 0;
    const cls =
      bal > 0 ? "red-amount" :
      bal < 0 ? "green-amount" :
      "zero-amount";

    const div = document.createElement("div");
    div.className = "customer-item";

    div.innerHTML = `
      <div class="cust-left">
        <div class="avatar" style="background:${cust.avatarColor || "#d9e2f3"};">
          ${cust.name.substring(0,2).toUpperCase()}
        </div>
        <div>
          <div class="cust-name">${cust.name}</div>
          <div class="cust-time">এইমাত্র</div>
        </div>
      </div>

      <div class="cust-right">
        <span class="cust-amount ${cls}">${money(Math.abs(bal))}</span>
        <i class="fa-solid fa-chevron-right"></i>
      </div>
    `;

    div.onclick = () => openLedger(cust);
    customerList.appendChild(div);
  });
}

function updateSummary() {
  let rec = 0;
  let giv = 0;

  customers.forEach(c => {
    const b = c.computedBalance || 0;
    if (b > 0) rec += b;
    if (b < 0) giv += Math.abs(b);
  });

  totalReceive.textContent = formatBanglaNumber(Math.round(rec));
  totalGive.textContent = formatBanglaNumber(Math.round(giv));
}

async function openLedger(customer) {
  currentCustomer = customer;

  switchScreen(ledgerScreen);

  ledgerName.textContent = customer.name;
  ledgerAvatar.textContent = customer.name.substring(0, 2).toUpperCase();
  ledgerAvatar.style.background = customer.avatarColor || "#0b61a4";

  const txns = await getTransactions(customer.id);
  const bal = calcBalance(customer, txns);

  currentCustomer.computedBalance = bal;

  if (bal >= 0) {
    ledgerBalanceLabel.textContent = "পাবো";
    ledgerBalance.textContent = `৳ ${money(bal)}`;
    ledgerBalance.style.color = "#b51e23";
  } else {
    ledgerBalanceLabel.textContent = "দেবো";
    ledgerBalance.textContent = `৳ ${money(Math.abs(bal))}`;
    ledgerBalance.style.color = "#118a4d";
  }

  const transactionList = document.getElementById("transactionList");
  transactionList.innerHTML = "";

  txns.forEach(txn => {
    const div = document.createElement("div");

    const amount = txn.give > 0 ? txn.give : txn.receive;
    const label = txn.give > 0 ? "দিলাম" : "পেলাম";
    const cls = txn.give > 0 ? "give" : "receive";

    div.className = "transaction-item";

    div.innerHTML = `
      <div class="txn-note">${txn.note || "লেনদেন"}</div>
      <div class="txn-amount ${cls}">
        ${label}: ৳ ${money(amount)}
      </div>
    `;

    transactionList.appendChild(div);
  });

  renderReport(txns, customer);
}

function renderReport(txns, customer) {
  if (!reportTxnList) return;

  reportTxnList.innerHTML = "";

  let totalGave = 0;
  let totalGot = 0;

  txns.forEach(txn => {
    const row = document.createElement("div");
    row.className = "report-row";

    if (txn.give > 0) totalGave += txn.give;
    if (txn.receive > 0) totalGot += txn.receive;

    const d = new Date(txn.createdAt);

    row.innerHTML = `
      <div class="rep-details">
        <div class="rep-date">${formatDateBangla(d)}</div>
        <div class="rep-time">${formatTimeBangla(d)}</div>
        <div class="rep-note">${txn.note || "লেনদেন"}</div>
      </div>

      <div class="rep-gave">
        ${txn.give > 0 ? money(txn.give) : ""}
      </div>

      <div class="rep-got">
        ${txn.receive > 0 ? money(txn.receive) : ""}
      </div>
    `;

    reportTxnList.appendChild(row);
  });

  reportTotalGave.textContent = money(totalGave);
  reportTotalGot.textContent = money(totalGot);
}

if (deleteCustomerBtn) {
  deleteCustomerBtn.onclick = (e) => {
    e.stopPropagation();
    threeDotMenu.classList.toggle("active");
  };
}

document.addEventListener("click", () => {
  if (threeDotMenu) {
    threeDotMenu.classList.remove("active");
  }
});

if (optReport) {
  optReport.onclick = () => {
    reportViewContainer.style.display = "flex";
  };
}

if (closeReportBtn) {
  closeReportBtn.onclick = () => {
    reportViewContainer.style.display = "none";
  };
}

if (optDelete) {
  optDelete.onclick = async () => {
    if (!currentCustomer) return;

    if (confirm("ডিলিট করতে চান?")) {
      await deleteCustomer(currentCustomer.id);
      currentCustomer = null;
      await loadDashboard();
      switchScreen(homeScreen);
    }
  };
}

/* SAVE CUSTOMER */
if (saveCustomerBtn) {
  saveCustomerBtn.onclick = async function (e) {
    e.preventDefault();

    try {
      const name = customerName.value.trim();
      const phone = customerPhone.value.trim();
      const opening = parseFloat(customerOpening.value) || 0;

      if (!name) {
        alert("গ্রাহকের নাম লিখুন");
        return;
      }

      /* EDIT MODE */
      if (
        currentCustomer &&
        customerFormTitle.textContent === "গ্রাহক তথ্য এডিট করুন"
      ) {
        currentCustomer.name = name;
        currentCustomer.phone = phone;

        await updateCustomer(currentCustomer);
        await loadDashboard();
        await openLedger(currentCustomer);
        return;
      }

      /* NEW CUSTOMER */
      const colors = [
        "#c8e6c9",
        "#f3e5ab",
        "#d9e2f3",
        "#f6d6dc"
      ];

      const newCust = {
        id: "cust_" + Date.now(),
        name: name,
        phone: phone,
        openingBalance: opening,
        createdAt: Date.now(),
        avatarColor: colors[Math.floor(Math.random() * colors.length)]
      };

      await addCustomer(newCust);

      customerName.value = "";
      customerPhone.value = "";
      customerOpening.value = "";

      await loadDashboard();
      await openLedger(newCust);

    } catch (err) {
      console.error(err);
      alert("Customer save error");
    }
  };
}

/* OPEN FORM */
if (openCustomerModal) {
  openCustomerModal.onclick = function () {
    currentCustomer = null;

    customerFormTitle.textContent = "নতুন গ্রাহক যোগ করুন";

    customerName.value = "";
    customerPhone.value = "";
    customerOpening.value = "";

    if (openingBalContainer) {
      openingBalContainer.style.display = "block";
    }

    switchScreen(customerFormScreen);
  };
}

/* EDIT */
if (optEdit) {
  optEdit.onclick = function () {
    if (!currentCustomer) return;

    customerFormTitle.textContent = "গ্রাহক তথ্য এডিট করুন";

    customerName.value = currentCustomer.name || "";
    customerPhone.value = currentCustomer.phone || "";

    if (openingBalContainer) {
      openingBalContainer.style.display = "none";
    }

    switchScreen(customerFormScreen);
  };
}

/* SEARCH */
if (searchInput) {
  searchInput.oninput = function () {
    const q = searchInput.value.toLowerCase();

    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(q)
    );

    renderCustomerList(filtered);
  };
}

/* SAVE TRANSACTION */
if (saveTxnBtn) {
  saveTxnBtn.onclick = async function () {
    if (!currentCustomer) return;

    try {
      const giveVal = parseFloat(txnGive.value) || 0;
      const receiveVal = parseFloat(txnReceive.value) || 0;
      const noteVal = txnNote.value.trim();

      if (giveVal <= 0 && receiveVal <= 0) {
        alert("টাকার পরিমাণ লিখুন");
        return;
      }

      const txn = {
        id: "txn_" + Date.now(),
        customerId: currentCustomer.id,
        give: giveVal,
        receive: receiveVal,
        note: noteVal,
        createdAt: Date.now()
      };

      await addTransaction(txn);

      txnGive.value = "";
      txnReceive.value = "";
      txnNote.value = "";

      await loadDashboard();

      const updated = customers.find(c => c.id === currentCustomer.id);
      if (updated) {
        await openLedger(updated);
      }

    } catch (err) {
      console.error(err);
      alert("Transaction save error");
    }
  };
}

/* BACK */
document.addEventListener("click", function (e) {
  const btn = e.target.closest(".back-btn");
  if (!btn) return;

  if (customerFormScreen.classList.contains("active")) {
    switchScreen(homeScreen);
    return;
  }

  if (ledgerScreen.classList.contains("active")) {
    switchScreen(homeScreen);
    return;
  }
});

/* CALCULATOR */
function updateSaveBtnState() {
  if (!saveTxnBtn) return;

  const hasValue =
    (parseFloat(txnGive.value) || 0) > 0 ||
    (parseFloat(txnReceive.value) || 0) > 0;

  if (hasValue) {
    saveTxnBtn.classList.add("active");
  } else {
    saveTxnBtn.classList.remove("active");
  }
}

if (inlineCalculator && moneyInputs.length) {
  moneyInputs.forEach(input => {
    input.onclick = function () {
      activeMoneyInput = input;
      calcExpression = input.value || "";
      inlineCalculator.classList.add("show");
    };
  });

  calcKeys.forEach(key => {
    key.onclick = function () {
      if (!activeMoneyInput) return;

      const val = key.dataset.key;

      if (val === "AC") {
        calcExpression = "";
      } else if (val === "BACK") {
        calcExpression = calcExpression.slice(0, -1);
      } else if (val === "=") {
        try {
          const safe = calcExpression
            .replace(/×/g, "*")
            .replace(/÷/g, "/");

          calcExpression = String(eval(safe));
        } catch {
          calcExpression = "";
        }
      } else {
        calcExpression += val;
      }

      activeMoneyInput.value = calcExpression;
      updateSaveBtnState();
    };
  });
}

if (txnNote) {
  txnNote.onfocus = function () {
    if (inlineCalculator) {
      inlineCalculator.classList.remove("show");
    }
  };
}


