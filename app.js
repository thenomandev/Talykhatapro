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
const openCustomerModalTop = document.getElementById("openCustomerModalTop");
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

// লেজার স্ক্রিনের অন্যান্য অ্যাকশন উইজেটস
const btnGive = document.getElementById("btnGive");
const btnReceive = document.getElementById("btnReceive");
const txnModal = document.getElementById("txnModal");
const txnModalTitle = document.getElementById("txnModalTitle");
const closeTxnModal = document.getElementById("closeTxnModal");
const saveTxnBtn = document.getElementById("saveTxnBtn");
const txnAmount = document.getElementById("txnAmount");
const txnNote = document.getElementById("txnNote");
const txnDateBtn = document.getElementById("txnDateBtn");
const transactionList = document.getElementById("transactionList");

const reportBtn = document.getElementById("reportBtn");
const reportViewContainer = document.getElementById("reportViewContainer");
const closeReportBtn = document.getElementById("closeReportBtn");
const reportTxnList = document.getElementById("reportTxnList");
const reportTotalGave = document.getElementById("reportTotalGave");
const reportTotalGot = document.getElementById("reportTotalGot");

/* INITIAL LOAD */
window.addEventListener("DOMContentLoaded", async () => {
  await loadDashboard();

  // প্রতি ৩০ সেকেন্ড পর পর হোম লিস্টের লাইভ টাইম কাউন্টার অটো আপডেট হবে
  setInterval(() => {
    if (homeScreen.classList.contains("active")) {
      const q = searchInput ? searchInput.value.toLowerCase() : "";
      const filtered = customers.filter(c => c.name.toLowerCase().includes(q));
      renderCustomerList(filtered);
    }
  }, 30000);
});

async function loadDashboard() {
  customers = await getAllCustomers();
  
  for (let c of customers) {
    const txns = await getTransactions(c.id);
    c.computedBalance = calcBalance(c, txns);
  }

  customers.sort((a, b) => a.name.localeCompare(b.name, "bn"));

  const q = searchInput ? searchInput.value.toLowerCase() : "";
  const filtered = customers.filter(c => c.name.toLowerCase().includes(q));
  
  renderCustomerList(filtered);
  updateSummary();
}

/* কাস্টমার লিস্ট রেন্ডারার এবং লাইভ টাইম জেনারেটর (১ নম্বর স্ক্রিনশটের অনুকরণে) */
async function renderCustomerList(list) {
  customerList.innerHTML = "";
  customerCount.textContent = list.length;

  if (list.length === 0) {
    customerList.innerHTML = `<div style="text-align:center; padding: 30px; color: #888;">কোনো গ্রাহক পাওয়া যায়নি</div>`;
    return;
  }

  for (let i = 0; i < list.length; i++) {
    const cust = list[i];
    const div = document.createElement("div");
    div.className = "customer-item";
    
    const bal = cust.computedBalance || 0;
    let balText = "০.০০";
    let balClass = "";
    
    // ১ নম্বর স্ক্রিনশটের মতো কারেন্সি সিম্বল (৳) রিমুভ করা হয়েছে
    if (bal > 0) {
      balText = formatBanglaNumber(moneyWithoutSymbol(bal));
      balClass = "receive"; 
    } else if (bal < 0) {
      balText = formatBanglaNumber(moneyWithoutSymbol(Math.abs(bal)));
      balClass = "give"; 
    } else {
      balText = formatBanglaNumber("০.০০");
      balClass = "";
    }

    // লাইভ শেষ ট্রানজেকশন ট্র্যাকিং এর উপর ভিত্তি করে লাইভ সেকেন্ড/মিনিট/ঘণ্টা/দিন কাউন্ট লজিক
    const txns = await getTransactions(cust.id);
    let referenceTime = cust.createdAt || Date.now();
    if (txns && txns.length > 0) {
      referenceTime = txns[0].createdAt; 
    }
    
    const diffMs = Date.now() - referenceTime;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    let timeText = "এইমাত্র";

    if (diffSecs > 0 && diffSecs < 60) {
      timeText = `${formatBanglaNumber(diffSecs)} সেকেন্ড`;
    } else if (diffMins >= 1 && diffMins < 60) {
      timeText = `${formatBanglaNumber(diffMins)} মিনিট`;
    } else if (diffHours >= 1 && diffHours < 24) {
      timeText = `${formatBanglaNumber(diffHours)} ঘণ্টা`;
    } else if (diffDays >= 1) {
      timeText = `${formatBanglaNumber(diffDays)} দিন`;
    }

    const premiumBgClass = `avatar-premium-${i % 5}`;

    div.innerHTML = `
      <div class="cust-left">
        <div class="avatar ${premiumBgClass}" style="width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; font-size: 16px;">
          ${cust.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="font-weight: 600; font-size: 16px; color: #222;">${cust.name}</div>
          <div class="cust-time">${timeText}</div>
        </div>
      </div>
      <div class="cust-right ${balClass}">
        ${balText}
      </div>
    `;

    div.onclick = () => openLedger(cust);
    customerList.appendChild(div);
  }
}

/* ড্যাশবোর্ড সামারি কারেকশন (৳ সিম্বল ছাড়া) */
function updateSummary() {
  let rec = 0;
  let giv = 0;
  customers.forEach(c => {
    const b = c.computedBalance || 0;
    if (b > 0) rec += b;
    if (b < 0) giv += Math.abs(b);
  });
  totalReceive.textContent = formatBanglaNumber(moneyWithoutSymbol(rec));
  totalGive.textContent = formatBanglaNumber(moneyWithoutSymbol(giv));
}

function moneyWithoutSymbol(v) {
  let parsed = parseFloat(v);
  if (isNaN(parsed) || parsed === 0) return "০.০০";
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function moneyWithSymbol(v) {
  let parsed = parseFloat(v);
  if (isNaN(parsed)) return "০.০০";
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* CORE EVENT HANDLERS */
const triggerCustomerModal = () => {
  customerFormTitle.textContent = "নতুন গ্রাহক যোগ করুন";
  customerName.value = "";
  customerPhone.value = "";
  customerOpening.value = "";
  if (openingBalContainer) openingBalContainer.style.display = "block";
  switchScreen(customerFormScreen);
};

if (openCustomerModal) openCustomerModal.onclick = triggerCustomerModal;
if (openCustomerModalTop) openCustomerModalTop.onclick = triggerCustomerModal;

if (backFromCustomerForm) {
  backFromCustomerForm.onclick = async () => {
    await loadDashboard();
    switchScreen(homeScreen);
  };
}

if (saveCustomerBtn) {
  saveCustomerBtn.onclick = async () => {
    const nameVal = customerName.value.trim();
    if (!nameVal) {
      alert("নাম আবশ্যিক!");
      return;
    }
    const phoneVal = customerPhone.value.trim();
    const openVal = parseFloat(customerOpening.value) || 0;

    const id = currentCustomer ? currentCustomer.id : "cust_" + Date.now();
    const newCust = {
      id,
      name: nameVal,
      phone: phoneVal,
      openingBalance: currentCustomer ? currentCustomer.openingBalance : openVal,
      createdAt: currentCustomer ? currentCustomer.createdAt : Date.now()
    };

    if (currentCustomer) {
      await updateCustomer(newCust);
    } else {
      await addCustomer(newCust);
    }

    currentCustomer = null;
    await loadDashboard();
    switchScreen(homeScreen);
  };
}

if (searchInput) {
  searchInput.oninput = () => {
    const q = searchInput.value.toLowerCase();
    const filtered = customers.filter(c => c.name.toLowerCase().includes(q));
    renderCustomerList(filtered);
  };
}

/* LEDGER & TRANSACTION SCREEN MANAGEMENT (সংরক্ষিত ও অপরিবর্তিত) */
async function openLedger(cust) {
  currentCustomer = cust;
  if (ledgerName) ledgerName.textContent = cust.name;
  if (ledgerAvatar) ledgerAvatar.textContent = cust.name.charAt(0).toUpperCase();
  
  await refreshLedgerList();
  switchScreen(ledgerScreen);
}

async function refreshLedgerList() {
  if (!currentCustomer) return;
  const txns = await getTransactions(currentCustomer.id);
  const bal = calcBalance(currentCustomer, txns);
  currentCustomer.computedBalance = bal;

  if (ledgerBalance) {
    if (bal > 0) {
      ledgerBalance.textContent = "৳ " + formatBanglaNumber(moneyWithSymbol(bal));
      if (ledgerBalanceLabel) ledgerBalanceLabel.textContent = "পাবো";
    } else if (bal < 0) {
      ledgerBalance.textContent = "৳ " + formatBanglaNumber(moneyWithSymbol(Math.abs(bal)));
      if (ledgerBalanceLabel) ledgerBalanceLabel.textContent = "দেবো";
    } else {
      ledgerBalance.textContent = "৳ ০.০০";
      if (ledgerBalanceLabel) ledgerBalanceLabel.textContent = "পরিশোধ";
    }
  }

  if (transactionList) {
    transactionList.innerHTML = "";
    if (txns.length === 0) {
      transactionList.innerHTML = `<div style="text-align:center; padding:30px; color:#aaa;">কোনো লেনদেন নেই</div>`;
      return;
    }

    txns.forEach(t => {
      const item = document.createElement("div");
      item.className = "txn-item";
      
      const d = new Date(t.createdAt);
      const dateStr = d.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
      const timeStr = d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });

      let amtText = "০.০০";
      let styleClass = "";
      if (t.give > 0) {
        amtText = "দিলাম ৳ " + formatBanglaNumber(moneyWithSymbol(t.give));
        styleClass = "give";
      } else {
        amtText = "পেলাম ৳ " + formatBanglaNumber(moneyWithSymbol(t.receive));
        styleClass = "receive";
      }

      item.innerHTML = `
        <div class="txn-left-meta">
          <span class="txn-date-label">${dateStr}</span>
          <span class="txn-time-label">${timeStr}</span>
          ${t.note ? `<span class="txn-note-label">${t.note}</span>` : ""}
        </div>
        <div class="txn-right-val ${styleClass}">${amtText}</div>
      `;
      transactionList.appendChild(item);
    });
  }
}

/* TRANSACTION ACTIONS */
if (btnGive) {
  btnGive.onclick = () => {
    txnModalTitle.textContent = "আমি দিলাম (গ্রাহক পেলো)";
    txnAmount.value = "";
    txnNote.value = "";
    selectedTxnDate = new Date();
    updateTxnDateButton();
    txnModal.style.display = "block";
  };
}

if (btnReceive) {
  btnReceive.onclick = () => {
    txnModalTitle.textContent = "আমি পেলাম (গ্রাহক দিলো)";
    txnAmount.value = "";
    txnNote.value = "";
    selectedTxnDate = new Date();
    updateTxnDateButton();
    txnModal.style.display = "block";
  };
}

if (closeTxnModal) {
  closeTxnModal.onclick = () => { txnModal.style.display = "none"; };
}

if (saveTxnBtn) {
  saveTxnBtn.onclick = async () => {
    const val = parseFloat(txnAmount.value) || 0;
    if (val <= 0) {
      alert("সঠিক পরিমাণ লিখুন!");
      return;
    }
    const isGive = txnModalTitle.textContent.includes("দিলাম");
    const txn = {
      id: "txn_" + Date.now(),
      customerId: currentCustomer.id,
      give: isGive ? val : 0,
      receive: isGive ? 0 : val,
      note: txnNote.value.trim(),
      createdAt: selectedTxnDate.getTime()
    };

    await addTransaction(txn);
    txnModal.style.display = "none";
    await refreshLedgerList();
  };
}

if (backToHome) {
  backToHome.onclick = async () => {
    currentCustomer = null;
    await loadDashboard();
    switchScreen(homeScreen);
  };
}

/* REPORT GENERATOR IMPLEMENTATION */
if (reportBtn) {
  reportBtn.onclick = async () => {
    if (!currentCustomer) return;
    const txns = await getTransactions(currentCustomer.id);
    if (reportTxnList) {
      reportTxnList.innerHTML = "";
      let tGave = 0;
      let tGot = 0;

      txns.forEach(t => {
        tGave += (t.give || 0);
        tGot += (t.receive || 0);

        const row = document.createElement("div");
        row.className = "rep-item";

        const d = new Date(t.createdAt);
        const dStr = d.toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" });
        const tStr = d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });

        row.innerHTML = `
          <div class="rep-details">
            <span class="rep-date">${dStr}</span>
            <span class="rep-time">${tStr}</span>
            ${t.note ? `<span class="rep-note">${t.note}</span>` : ""}
            <span class="rep-tag">এন্ট্রি: অনলাইন</span>
          </div>
          <div class="rep-gave">${t.give > 0 ? formatBanglaNumber(moneyWithSymbol(t.give)) : "-"}</div>
          <div class="rep-got">${t.receive > 0 ? formatBanglaNumber(moneyWithSymbol(t.receive)) : "-"}</div>
        `;
        reportTxnList.appendChild(row);
      });

      if (reportTotalGave) reportTotalGave.textContent = formatBangTotalGave = formatBanglaNumber(moneyWithSymbol(tGave));
      if (reportTotalGot) reportTotalGot.textContent = formatBanglaNumber(moneyWithSymbol(tGot));
    }
    if (reportViewContainer) reportViewContainer.style.display = "flex";
  };
}

if (closeReportBtn) {
  closeReportBtn.onclick = () => {
    if (reportViewContainer) reportViewContainer.style.display = "none";
  };
}

/* HELPERS */
function switchScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function calcBalance(cust, txns) {
  let bal = cust.openingBalance || 0;
  if (txns && txns.length > 0) {
    txns.forEach(t => {
      bal += (t.give || 0);
      bal -= (t.receive || 0);
    });
  }
  return bal; 
}

// ডেট বাটন আপডেট লজিক
function updateTxnDateButton() {
  if (txnDateBtn) {
    txnDateBtn.textContent = "📅 " + selectedTxnDate.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
  }
}

function formatBanglaNumber(str) {
  const englishToBangla = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return str.toString().replace(/[0-9]/g, w => englishToBangla[w] || w);
}
