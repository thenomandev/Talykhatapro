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
const backFromCustomerForm = document.getElementById("backFromCustomerForm");
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

const txnAmount = document.getElementById("txnAmount");
const txnNote = document.getElementById("txnNote");
const giveSubmitBtn = document.getElementById("giveSubmitBtn");
const receiveSubmitBtn = document.getElementById("receiveSubmitBtn");
const transactionList = document.getElementById("transactionList");

const menuBtn = document.getElementById("menuBtn");
const dropdownMenu = document.getElementById("dropdownMenu");
const deleteCustomerBtn = document.getElementById("deleteCustomerBtn");

const reportViewBtn = document.getElementById("reportViewBtn");
const reportViewScreen = document.getElementById("reportViewScreen");
const reportBackBtn = document.getElementById("reportBackBtn");
const reportTableBody = document.getElementById("reportTableBody");
const reportTotalGave = document.getElementById("reportTotalGave");
const reportTotalGot = document.getElementById("reportTotalGot");

const inlineCalculator = document.getElementById("inlineCalculator");
const calcKeys = document.querySelectorAll(".calc-key");

let activeMoneyInput = null;
let calcExpression = "";

/* APP INIT */
document.addEventListener("DOMContentLoaded", async () => {
  await loadCustomers();
  setupEventListeners();
  setupFloatingLabels();
});

/* FLOATING LABELS SUITE */
function setupFloatingLabels() {
  const checkInput = (input) => {
    const group = input.closest(".premium-field-group");
    if (group) {
      if (input.value.trim() !== "") {
        group.classList.add("has-value");
      } else {
        group.classList.remove("has-value");
      }
    }
  };

  document.querySelectorAll(".premium-field-group input").forEach(input => {
    input.addEventListener("input", () => checkInput(input));
    input.addEventListener("blur", () => checkInput(input));
    input.addEventListener("focus", () => checkInput(input));
    checkInput(input);
  });
}

function forceCheckAllLabels() {
  setTimeout(() => {
    document.querySelectorAll(".premium-field-group input").forEach(input => {
      const group = input.closest(".premium-field-group");
      if (group) {
        if (input.value.trim() !== "") group.classList.add("has-value");
        else group.classList.remove("has-value");
      }
    });
  }, 50);
}

/* EVENT LISTENERS */
function setupEventListeners() {
  openCustomerModal.addEventListener("click", () => {
    customerFormTitle.innerText = "নতুন গ্রাহক যোগ করুন";
    customerName.value = "";
    customerPhone.value = "";
    customerOpening.value = "";
    openingBalContainer.style.display = "block";
    switchScreen(customerFormScreen);
    forceCheckAllLabels();
  });

  backFromCustomerForm.addEventListener("click", () => {
    switchScreen(homeScreen);
    hideCalculator();
  });

  saveCustomerBtn.addEventListener("click", handleSaveCustomer);

  backToHome.addEventListener("click", () => {
    switchScreen(homeScreen);
    hideCalculator();
    loadCustomers();
  });

  giveSubmitBtn.addEventListener("click", () => handleTransactionSubmit("give"));
  receiveSubmitBtn.addEventListener("click", () => handleTransactionSubmit("receive"));

  searchInput.addEventListener("input", (e) => {
    renderCustomers(e.target.value.trim());
  });

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.style.display = dropdownMenu.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", () => {
    dropdownMenu.style.display = "none";
  });

  deleteCustomerBtn.addEventListener("click", handleDeleteCustomer);

  reportViewBtn.addEventListener("click", openReportView);
  reportBackBtn.addEventListener("click", () => {
    reportViewScreen.style.display = "none";
  });

  // CLOSE KEYBOARD CONTROL VIA SCREEN CLICK
  document.addEventListener("pointerdown", (e) => {
    if (!inlineCalculator.contains(e.target) && !e.target.classList.contains("money-input")) {
      hideCalculator();
    }
  });
}

/* LOAD & RENDER */
async function loadCustomers() {
  customers = await getAllCustomers();
  renderCustomers();
}

function renderCustomers(query = "") {
  customerList.innerHTML = "";
  let filtered = customers;

  if (query) {
    filtered = customers.filter(c => c.name.includes(query) || c.phone.includes(query));
  }

  customerCount.innerText = formatBanglaNumber(filtered.length);

  let netReceive = 0;
  let netGive = 0;

  filtered.forEach(cust => {
    const bal = cust.currentBalance || 0;
    if (bal < 0) netReceive += Math.abs(bal);
    else if (bal > 0) netGive += bal;

    const item = document.createElement("div");
    item.className = "customer-item";

    const colors = ["green", "yellow", "blue", "pink"];
    const randomColor = colors[Math.abs(cust.id) % colors.length];
    const initial = cust.name.charAt(0);

    let statusText = "০.০০";
    let statusClass = "neutral";

    if (bal < 0) {
      statusText = "পাবো " + money(Math.abs(bal));
      statusClass = "receive";
    } else if (bal > 0) {
      statusText = "দেবে " + money(bal);
      statusClass = "give";
    }

    item.innerHTML = `
      <div class="cust-left">
        <div class="avatar ${randomColor}">${initial}</div>
        <div>
          <div class="cust-name">${cust.name}</div>
          <div class="cust-time">সক্রিয়</div>
        </div>
      </div>
      <div class="cust-right ${statusClass}">${statusText}</div>
    `;

    item.addEventListener("click", () => openLedger(cust));
    customerList.appendChild(item);
  });

  totalReceive.innerText = money(netReceive);
  totalGive.innerText = money(netGive);
}

/* ACTIONS */
async function handleSaveCustomer() {
  const name = customerName.value.trim();
  const phone = customerPhone.value.trim();
  const openingStr = customerOpening.value.trim();

  if (!name) return alert("গ্রাহকের নাম লিখুন");

  const openingAmount = parseFloat(openingStr) || 0;

  const newCust = {
    id: Date.now(),
    name: name,
    phone: phone || "N/A",
    openingBalance: openingAmount,
    currentBalance: openingAmount,
    createdAt: Date.now()
  };

  await addCustomer(newCust);
  await loadCustomers();
  switchScreen(homeScreen);
  hideCalculator();
}

async function openLedger(customer) {
  currentCustomer = customer;
  ledgerName.innerText = customer.name;
  switchScreen(ledgerScreen);
  hideCalculator();
  txnAmount.value = "";
  txnNote.value = "";
  await refreshTransactionList();
}

async function refreshTransactionList() {
  if (!currentCustomer) return;
  const txns = await getTransactions(currentCustomer.id);

  let currentBal = currentCustomer.openingBalance || 0;
  txns.slice().reverse().forEach(t => {
    currentBal += (t.give || 0);
    currentBal -= (t.receive || 0);
  });

  currentCustomer.currentBalance = currentBal;
  await updateCustomer(currentCustomer);

  if (currentBal < 0) {
    ledgerBalanceLabel.innerText = "পাবো " + money(Math.abs(currentBal));
    ledgerBalanceLabel.style.color = "#2e7d32";
  } else if (currentBal > 0) {
    ledgerBalanceLabel.innerText = "দেবে " + money(currentBal);
    ledgerBalanceLabel.style.color = "#c62828";
  } else {
    ledgerBalanceLabel.innerText = "পরিশোধ";
    ledgerBalanceLabel.style.color = "#5f6368";
  }

  const initial = currentCustomer.name.charAt(0);
  ledgerAvatar.innerText = initial;

  transactionList.innerHTML = "";
  txns.forEach(t => {
    const item = document.createElement("div");
    item.className = "txn-item";

    const dt = new Date(t.createdAt);
    const dateStr = formatDateBangla(dt);
    const timeStr = formatTimeBangla(dt);

    item.innerHTML = `
      <div class="txn-details">
        <div class="txn-date">${dateStr}</div>
        <div class="txn-time">${timeStr}</div>
        <div class="txn-note-text">${t.note || "কোনো বিবরণ নেই"}</div>
      </div>
      <div class="txn-gave-val">${t.give ? money(t.give) : "--"}</div>
      <div class="txn-received-val">${t.receive ? money(t.receive) : "--"}</div>
    `;
    transactionList.appendChild(item);
  });
  
  forceCheckAllLabels();
}

async function handleTransactionSubmit(type) {
  const amount = parseFloat(txnAmount.value.trim());
  const note = txnNote.value.trim();

  if (!amount || amount <= 0) return alert("সঠিক পরিমাণ লিখুন");

  const txn = {
    id: Date.now(),
    customerId: currentCustomer.id,
    give: type === "give" ? amount : 0,
    receive: type === "receive" ? amount : 0,
    note: note,
    createdAt: Date.now()
  };

  await addTransaction(txn);
  txnAmount.value = "";
  txnNote.value = "";
  hideCalculator();
  await refreshTransactionList();
}

async function handleDeleteCustomer() {
  if (confirm("আপনি কি নিশ্চিতভাবে এই কাস্টমার রিমুভ করতে চান?")) {
    await deleteCustomer(currentCustomer.id);
    await loadCustomers();
    switchScreen(homeScreen);
    hideCalculator();
  }
}

async function openReportView() {
  if (!currentCustomer) return;
  reportViewScreen.style.display = "flex";
  const txns = await getTransactions(currentCustomer.id);

  reportTableBody.innerHTML = "";
  let totalGave = 0;
  let totalGot = 0;

  txns.forEach(t => {
    totalGave += (t.give || 0);
    totalGot += (t.receive || 0);

    const row = document.createElement("div");
    row.className = "rep-row";

    const dt = new Date(t.createdAt);
    row.innerHTML = `
      <div class="rep-details">
        <div class="rep-date">${formatDateBangla(dt)}</div>
        <div class="rep-time">${formatTimeBangla(dt)}</div>
        <div class="rep-note">${t.note || ""}</div>
      </div>
      <div class="rep-gave">${t.give ? money(t.give) : "--"}</div>
      <div class="rep-got">${t.receive ? money(t.receive) : "--"}</div>
    `;
    reportTableBody.appendChild(row);
  });

  reportTotalGave.innerText = money(totalGave);
  reportTotalGot.innerText = money(totalGot);
}

/* INLINE PRECISE KEYBOARD CALCULATOR CONTROL */
const hideCalculator = () => {
  inlineCalculator.classList.remove("show");
  activeMoneyInput = null;
};

document.querySelectorAll(".money-input").forEach(input => {
  const activateInput = (e) => {
    e.preventDefault();
    activeMoneyInput = input;
    calcExpression = input.value;
    inlineCalculator.classList.add("show");
    input.focus();
  };
  input.addEventListener("pointerdown", activateInput);
});

// INSTANT POINTER-DOWN FOR CALC KEYS (ELIMINATES 1s LATENCY)
calcKeys.forEach(key => {
  key.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!activeMoneyInput) return;

    const val = key.dataset.key;

    if (val === "AC") {
      calcExpression = "";
    } else if (val === "BACK") {
      calcExpression = calcExpression.slice(0, -1);
    } else if (val === "=") {
      try {
        const safeExpr = calcExpression.replace(/×/g, "*").replace(/÷/g, "/");
        if (!/^[0-9+\\-*/%.() ]+$/.test(safeExpr)) throw new Error("Invalid");
        calcExpression = String(Function("return (" + safeExpr.replace(/%/g, "/100") + ")")());
      } catch {
        calcExpression = "";
      }
    } else {
      calcExpression += val;
    }

    activeMoneyInput.value = calcExpression;
    
    // Dynamic Level Up Handler
    const group = activeMoneyInput.closest(".premium-field-group");
    if (group) {
      if (activeMoneyInput.value.trim() !== "") group.classList.add("has-value");
      else group.classList.remove("has-value");
    }
  });
});
