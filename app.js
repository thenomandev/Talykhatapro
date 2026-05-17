// app.js (modified renderCustomerList to match screenshot row design + secondary line + phone)
// All original logic preserved but home list rendering updated to exact screenshot style

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

const liveTimeCounter = document.querySelector(".status-right"); 
const reportViewContainer = document.getElementById("reportViewContainer");
const closeReportBtn = document.getElementById("closeReportBtn");
const reportTxnList = document.getElementById("reportTxnList");
const reportTotalGave = document.getElementById("reportTotalGave");
const reportTotalGot = document.getElementById("reportTotalGot");

/* INITIALIZE APP */
window.addEventListener("DOMContentLoaded", async () => {
  await loadDashboard();
  updateTxnDateButton();
});

async function loadDashboard() {
  customers = await getCustomers();
  
  for (let i = 0; i < customers.length; i++) {
    const txns = await getTransactions(customers[i].id);
    customers[i].computedBalance = calcBalance(customers[i], txns);
  }
  
  renderCustomerList(customers);
  updateSummary();
}

/* ========== NEW CUSTOMER RENDER (screenshot-perfect) ========== */
function renderCustomerList(list) {
  if (!customerList) return;
  customerList.innerHTML = "";
  const totalCount = list.length;
  customerCount.textContent = `${formatBanglaNumber(totalCount)} / সাপ্লায়ার ০`;

  if (list.length === 0) {
    customerList.innerHTML = `<div style="text-align:center;padding:40px;color:#888;">কোনো গ্রাহক নেই</div>`;
    return;
  }

  list.forEach((cust, idx) => {
    const row = document.createElement("div");
    row.className = "customer-row";

    const balance = cust.computedBalance || 0;
    const absBalance = Math.abs(balance);
    const amountClass = balance > 0 ? "red-amount" : (balance < 0 ? "green-amount" : "zero-amount");
    const displayAmount = money(absBalance);
    
    // avatar color mapping
    const colorClasses = ["avatar-green", "avatar-yellow", "avatar-blue", "avatar-pink"];
    const avatarColor = colorClasses[idx % 4];
    
    // relative time based on createdAt / last transaction
    let timeText = "এইমাত্র";
    const refTime = cust.createdAt || Date.now();
    const diffMs = Date.now() - refTime;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) timeText = "এইমাত্র";
    else if (mins < 60) timeText = `${formatBanglaNumber(mins)} মিনিট`;
    else if (hours < 24) timeText = `${formatBanglaNumber(hours)} ঘণ্টা`;
    else timeText = `${formatBanglaNumber(days)} দিন`;

    // secondary info: phone or default text
    const secondaryText = cust.phone && cust.phone.trim() !== "" ? cust.phone : "গ্রাহক";
    
    row.innerHTML = `
      <div class="customer-left">
        <div class="customer-avatar ${avatarColor}">${cust.name.substring(0, 2).toUpperCase()}</div>
        <div class="customer-info">
          <div class="customer-name">${escapeHtml(cust.name)}</div>
          <div class="customer-phone">${escapeHtml(secondaryText)}</div>
          <div class="customer-time">${timeText}</div>
        </div>
      </div>
      <div class="customer-right">
        <span class="customer-amount ${amountClass}">${displayAmount}</span>
        <i class="fa-solid fa-chevron-right chevron-icon"></i>
      </div>
    `;
    
    row.onclick = () => openLedger(cust);
    customerList.appendChild(row);
  });
}

function escapeHtml(str) { if(!str) return ""; return str.replace(/[&<>]/g, function(m){if(m==='&') return '&amp;'; if(m==='<') return '&lt;'; if(m==='>') return '&gt;'; return m;}); }

function updateSummary() {
  let rec = 0, giv = 0;
  customers.forEach(c => {
    const b = c.computedBalance || 0;
    if (b > 0) rec += b;
    if (b < 0) giv += Math.abs(b);
  });
  totalReceive.textContent = money(Math.round(rec));
  totalGive.textContent = money(Math.round(giv));
}

/* all remaining original methods: openLedger, startLiveTimer, transaction handling, delete, update etc 
   are kept identical to preserve ledger logic */
async function openLedger(customer) { // (full function preserved)
  currentCustomer = customer;
  switchScreen(ledgerScreen);
  ledgerName.textContent = customer.name;
  ledgerAvatar.textContent = customer.name.substring(0,2).toUpperCase();
  if (threeDotMenu) threeDotMenu.classList.remove("active");
  if (reportViewContainer) reportViewContainer.style.display = "none";
  const txns = await getTransactions(customer.id);
  startLiveTimer(customer, txns);
  const bal = calcBalance(customer, txns);
  currentCustomer.computedBalance = bal;
  if (bal >= 0) {
    if (ledgerBalanceLabel) ledgerBalanceLabel.textContent = "পাবো";
    ledgerBalance.innerHTML = `৳ ${money(bal)}`;
    ledgerTopBalance.innerHTML = `৳ ${money(bal)}`;
    ledgerBalance.style.color = "#b51e23";
  } else {
    if (ledgerBalanceLabel) ledgerBalanceLabel.textContent = "দেবো";
    ledgerBalance.innerHTML = `৳ ${money(Math.abs(bal))}`;
    ledgerTopBalance.innerHTML = `৳ ${money(Math.abs(bal))}`;
    ledgerBalance.style.color = "#118a4d";
  }
  const transactionList = document.getElementById("transactionList");
  if (transactionList) {
    transactionList.innerHTML = "";
    txns.forEach(txn => {
      const div = document.createElement("div");
      div.className = "transaction-item";
      const amount = txn.give > 0 ? txn.give : txn.receive;
      const cls = txn.give > 0 ? "give" : "receive";
      const label = txn.give > 0 ? "দিলাম" : "পেলাম";
      div.innerHTML = `<div class="txn-note">${txn.note || "লেনদেন"}</div><div class="txn-amount ${cls}">${label}: ৳ ${money(amount)}</div>`;
      div.oncontextmenu = async (e) => {
        e.preventDefault();
        if (confirm("এই লেনদেনটি ডিলিট করতে চান?")) { await deleteTransaction(txn.id); await loadDashboard(); const updated = customers.find(c => c.id === currentCustomer.id); if (updated) openLedger(updated); }
      };
      transactionList.appendChild(div);
    });
  }
  if (reportTxnList) {
    reportTxnList.innerHTML = "";
    let totalGaveSum = 0, totalGotSum = 0;
    if (customer.openingBalance && customer.openingBalance !== 0) {
      const row = document.createElement("div"); row.className = "report-row";
      const opDate = new Date(customer.createdAt || Date.now());
      let gaveVal = customer.openingBalance > 0 ? customer.openingBalance : 0;
      let gotVal = customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0;
      totalGaveSum += gaveVal; totalGotSum += gotVal;
      row.innerHTML = `<div class="rep-details"><div class="rep-date">${formatDateBangla(opDate)}</div><div class="rep-time">${formatTimeBangla(opDate)}</div><div class="rep-note">শুরুর ব্যালেন্স</div></div><div class="rep-gave">${gaveVal > 0 ? money(gaveVal) : ""}</div><div class="rep-got">${gotVal > 0 ? money(gotVal) : ""}</div>`;
      reportTxnList.appendChild(row);
    }
    [...txns].reverse().forEach(txn => {
      const row = document.createElement("div"); row.className = "report-row";
      const tDate = new Date(txn.createdAt);
      if (txn.give > 0) totalGaveSum += txn.give;
      if (txn.receive > 0) totalGotSum += txn.receive;
      row.innerHTML = `<div class="rep-details"><div class="rep-date">${formatDateBangla(tDate)}</div><div class="rep-time">${formatTimeBangla(tDate)}</div><div class="rep-note">${txn.note || "লেনদেন"}</div></div><div class="rep-gave">${txn.give > 0 ? money(txn.give) : ""}</div><div class="rep-got">${txn.receive > 0 ? money(txn.receive) : ""}</div>`;
      reportTxnList.appendChild(row);
    });
    if (reportTotalGave) reportTotalGave.textContent = money(totalGaveSum);
    if (reportTotalGot) reportTotalGot.textContent = money(totalGotSum);
  }
}
function startLiveTimer(cust, txns) { if (liveInterval) clearInterval(liveInterval); function updateTime() { let ref = cust.createdAt || Date.now(); if (txns && txns.length) ref = txns[0].createdAt; const diff = Date.now() - ref; const mins = Math.floor(diff/60000), hours = Math.floor(mins/60), days = Math.floor(hours/24); if (!liveTimeCounter) return; if (mins<1) liveTimeCounter.textContent="(এইমাত্র)"; else if (mins<60) liveTimeCounter.textContent=`(${formatBanglaNumber(mins)} মিনিট আগে)`; else if (hours<24) liveTimeCounter.textContent=`(${formatBanglaNumber(hours)} ঘণ্টা আগে)`; else liveTimeCounter.textContent=`(${formatBanglaNumber(days)} দিন আগে)`; } updateTime(); liveInterval = setInterval(updateTime,30000); }
if (deleteCustomerBtn) deleteCustomerBtn.onclick = (e) => { e.stopPropagation(); if (threeDotMenu) threeDotMenu.classList.toggle("active"); };
document.addEventListener("click", () => { if (threeDotMenu) threeDotMenu.classList.remove("active"); });
if (optTagada) optTagada.onclick = () => alert(`"${currentCustomer.name}" এর মোবাইলে তাগাদা মেসেজ পাঠানো হয়েছে!`);
if (optReport) optReport.onclick = () => { if (reportViewContainer) reportViewContainer.style.display = "flex"; };
if (closeReportBtn) closeReportBtn.onclick = () => { if (reportViewContainer) reportViewContainer.style.display = "none"; };
if (optEdit) optEdit.onclick = () => { customerFormTitle.textContent = "গ্রাহক তথ্য এডিট করুন"; customerName.value = currentCustomer.name; customerPhone.value = currentCustomer.phone || ""; if(openingBalContainer) openingBalContainer.style.display = "none"; switchScreen(customerFormScreen); };
if (optDelete) optDelete.onclick = async () => { if(confirm(`ডিলিট "${currentCustomer.name}" সম্পূর্ণ?`)){ if(liveInterval) clearInterval(liveInterval); await deleteCustomer(currentCustomer.id); currentCustomer=null; await loadDashboard(); switchScreen(homeScreen); } };
if (saveTxnBtn) saveTxnBtn.onclick = async () => { const giveVal = parseFloat(txnGive.value)||0, recVal = parseFloat(txnReceive.value)||0, noteVal = txnNote.value.trim(); if(giveVal===0 && recVal===0) { alert("সঠিক অংক লিখুন!"); return; } const newTxn = { id:Date.now().toString(), customerId:currentCustomer.id, give:giveVal, receive:recVal, note:noteVal, createdAt:selectedTxnDate.getTime() }; await addTransaction(newTxn); txnGive.value=""; txnReceive.value=""; txnNote.value=""; selectedTxnDate=new Date(); updateTxnDateButton(); await loadDashboard(); const updatedCust = customers.find(c=>c.id===currentCustomer.id); if(updatedCust) await openLedger(updatedCust); };
if (saveCustomerBtn) saveCustomerBtn.onclick = async (e) => { e.preventDefault(); const name=customerName.value.trim(); const phone=customerPhone.value.trim(); const opening=parseFloat(customerOpening.value)||0; if(!name){ alert("নাম লিখুন"); return; } if(customerFormTitle.textContent==="গ্রাহক তথ্য এডিট করুন"){ currentCustomer.name=name; currentCustomer.phone=phone; await updateCustomer(currentCustomer); await loadDashboard(); const updated= customers.find(c=>c.id===currentCustomer.id); await openLedger(updated||currentCustomer); } else { const newCust={ id:Date.now().toString(), name:name, phone:phone, openingBalance:opening, createdAt:Date.now() }; await addCustomer(newCust); await loadDashboard(); customerName.value=""; customerPhone.value=""; customerOpening.value=""; const saved=customers.find(c=>c.id===newCust.id); await openLedger(saved||newCust); } };
if (openCustomerModal) openCustomerModal.onclick = () => { customerFormTitle.textContent="নতুন গ্রাহক যোগ করুন"; customerName.value=""; customerPhone.value=""; customerOpening.value=""; if(openingBalContainer) openingBalContainer.style.display="block"; switchScreen(customerFormScreen); };
if (backToHome) backToHome.onclick = async () => { if(liveInterval) clearInterval(liveInterval); await loadDashboard(); switchScreen(homeScreen); };
if (backFromCustomerForm) backFromCustomerForm.onclick = async () => { if(currentCustomer) switchScreen(ledgerScreen); else { await loadDashboard(); switchScreen(homeScreen); } };
if (searchInput) searchInput.oninput = () => { const q = searchInput.value.toLowerCase(); const filtered = customers.filter(c=>c.name.toLowerCase().includes(q)); renderCustomerList(filtered); };
function updateTxnDateButton() { if(txnDateBtn) txnDateBtn.textContent="📅 "+selectedTxnDate.toLocaleDateString("bn-BD",{day:"numeric",month:"short"}); }
if(txnDateBtn) txnDateBtn.onclick = () => { txnDate.value = selectedTxnDate.toISOString().split("T")[0]; if(txnDate.showPicker) txnDate.showPicker(); };
if(txnDate) txnDate.onchange = () => { if(txnDate.value) { selectedTxnDate = new Date(txnDate.value); updateTxnDateButton(); } };