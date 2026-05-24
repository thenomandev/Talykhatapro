let customers = [];
let currentCustomer = null;
let selectedTxnDate = new Date();
let liveInterval = null;
let homeLiveInterval = null;
const editState = {
  isEditMode: false,
  draft: null
};

const addCustomerState = {
  userType: "customer",
  avatarImage: ""
};

function getCustomerUIState(){
  if(typeof createCustomerUIState !== "function"){
    return {
      userType: "customer",
      avatarImage: "",
      attachedPhoto: "",
      selectedDate: new Date()
    };
  }

  if(!window.__customerUIState){
    window.__customerUIState = createCustomerUIState();
  }

  return window.__customerUIState;
}

/* ELEMENTS */
const homeScreen = document.getElementById("homeScreen");
const customerFormScreen = document.getElementById("customerFormScreen");
const customerAddScreen = document.getElementById("customerAddScreen");
const ledgerScreen = document.getElementById("ledgerScreen");

const customerList = document.getElementById("customerList");
const customerCount = document.getElementById("customerCount");
const totalReceive = document.getElementById("totalReceive");
const totalGive = document.getElementById("totalGive");
const searchInput = document.getElementById("searchInput");

const openCustomerModal = document.getElementById("openCustomerModal");
const backFromCustomerForm = document.getElementById("backFromCustomerForm");

if(backFromCustomerForm){
  backFromCustomerForm.onclick = async ()=>{
    editState.isEditMode = false;
    editState.draft = null;
    window.onAvatarChanged = null;
    window.__editModeActive = false;

    if(liveInterval) clearInterval(liveInterval);

    const updated = customers.find(c => c.id === currentCustomer?.id);

    if(updated || currentCustomer){
      await openLedger(updated || currentCustomer);
    }else{
      await loadDashboard();
      switchScreen(homeScreen);
    }
  };
}

const saveCustomerBtn = document.getElementById("saveCustomerBtn");

const customerFormTitle = document.getElementById("customerFormTitle");
const customerName = document.getElementById("customerName");
const customerPhone = document.getElementById("customerPhone");
const customerOpening = document.getElementById("customerOpening");
const openingBalContainer = document.getElementById("openingBalContainer");
const customerDatePicker = document.getElementById("customerDatePicker");

const addCustomerName = document.getElementById("addCustomerName");
const addCustomerPhone = document.getElementById("addCustomerPhone");
const addCustomerOpening = document.getElementById("addCustomerOpening");
const addSaveCustomerBtn = document.getElementById("addSaveCustomerBtn");

const backFromCustomerAdd = document.getElementById("backFromCustomerAdd");
const addCustomerNameBox = document.getElementById("addCustomerNameBox");
const addCustomerPhoneBox = document.getElementById("addCustomerPhoneBox");
const addCustomerAvatarPreview = document.getElementById("addCustomerAvatarPreview");
const addCustomerAvatarIcon = document.getElementById("addCustomerAvatarIcon");

const addOpeningBalContainer =
  document.getElementById("addOpeningBalContainer");

if(addOpeningBalContainer){
  addOpeningBalContainer.style.display = "none";
}

if(addCustomerPhone){
  addCustomerPhone.addEventListener("focus", ()=>{
    addCustomerPhoneBox?.classList.add("active");
  });

  addCustomerPhone.addEventListener("blur", ()=>{
    addCustomerPhoneBox?.classList.remove("active");

    if(addCustomerPhone.value.trim()){
      addCustomerPhoneBox?.classList.add("has-value");
    }else{
      addCustomerPhoneBox?.classList.remove("has-value");
    }
  });
}

if(addCustomerName){
  addCustomerName.addEventListener("focus", ()=>{
    addCustomerNameBox?.classList.add("active");
  });

  addCustomerName.addEventListener("blur", ()=>{
    addCustomerNameBox?.classList.remove("active");

    if(addCustomerName.value.trim()){
      addCustomerNameBox?.classList.add("has-value");
    }else{
      addCustomerNameBox?.classList.remove("has-value");
    }
  });

  addCustomerName.addEventListener("input", updateAddCustomerValidation);
}

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
function updateSaveBtnState(){
  if(!saveTxnBtn) return;

  const giveVal = (parseFloat(txnGive?.value) || 0);
  const receiveVal = (parseFloat(txnReceive?.value) || 0);

  const hasAmount = giveVal > 0 || receiveVal > 0;

  if(hasAmount){
    saveTxnBtn.classList.add("active");
  }else{
    saveTxnBtn.classList.remove("active");
  }
}

function updateEditValidation(){
  if(!editState.isEditMode || !editState.draft) return;

  const name = customerName.value.trim();
  const phone = customerPhone.value.trim();

  const warning = document.getElementById("customerNameWarning");
  const error = document.getElementById("customerNameError");

  const changed =
    name !== (editState.draft.name || "") ||
    phone !== (editState.draft.phone || "") ||
    (getCustomerUIState().avatarImage || "") !== (editState.draft.avatarImage || "");

  const valid = name.length >= 3 && name.length <= 35;

  if(name.length > 0 && !valid){
    if(warning) warning.style.display = "block";
    if(error) error.style.display = "block";
  }else{
    if(warning) warning.style.display = "none";
    if(error) error.style.display = "none";
  }

  if(changed && valid){
    saveCustomerBtn.classList.add("active");
  }else{
    saveCustomerBtn.classList.remove("active");
  }
}

function setupEditFloatingUI(){
  const fields = [
    {
      input: customerName,
      box: document.getElementById("customerNameBox")
    },
    {
      input: customerPhone,
      box: document.getElementById("customerPhoneBox")
    }
  ];

  fields.forEach(({input, box})=>{
    if(!input || !box) return;

    input.addEventListener("focus", ()=>{
      box.classList.add("active");
    });

    input.addEventListener("blur", ()=>{
      box.classList.remove("active");

      if(input.value.trim()){
        box.classList.add("has-value");
      }else{
        box.classList.remove("has-value");
      }
    });
  });
}

function setupLedgerFloatingUI(){
  const fields = [
    { input: txnGive, box: document.getElementById("txnGiveBox") },
    { input: txnReceive, box: document.getElementById("txnReceiveBox") },
    { input: txnNote, box: document.getElementById("txnNoteBox") }
  ];

  fields.forEach(({input, box})=>{
    if(!input || !box) return;

    input.addEventListener("focus", ()=>{
      box.classList.add("active");
    });

    input.addEventListener("blur", ()=>{
      box.classList.remove("active");

      if(input.value.trim()){
        box.classList.add("has-value");
      }else{
        box.classList.remove("has-value");
      }
    });

    input.addEventListener("input", ()=>{
      if(input.value.trim()){
        box.classList.add("has-value");
      }else{
        box.classList.remove("has-value");
      }

      updateSaveBtnState();
    });
  });
}

const moneyInputs = document.querySelectorAll(".money-input");
const calcKeys = document.querySelectorAll(".calc-key");

let activeMoneyInput = null;
let calcExpression = "0";

const liveTimeCounter = document.querySelector(".status-right"); // index.html line match
const reportViewContainer = document.getElementById("reportViewContainer");
const closeReportBtn = document.getElementById("closeReportBtn");
const reportTxnList = document.getElementById("reportTxnList");
const reportTotalGave = document.getElementById("reportTotalGave");
const reportTotalGot = document.getElementById("reportTotalGot");

/* INITIALIZE APP */
window.addEventListener("DOMContentLoaded", async () => {
  await loadDashboard();
  updateTxnDateButton();
  // initPremiumCustomerUI();
  setupLedgerFloatingUI();
setupEditFloatingUI();
  setupLedgerKeyboardLift();
  history.replaceState({screen:"home"}, "");
  history.pushState({screen:"ready"}, "");
});

async function loadDashboard() {
  customers = await getCustomers();
  
  for (let i = 0; i < customers.length; i++) {
    const txns = await getTransactions(customers[i].id);
    customers[i].computedBalance = calcBalance(customers[i], txns);
  }
  
  renderCustomerList(customers);
  updateSummary();

if(homeLiveInterval){
  clearInterval(homeLiveInterval);
}

homeLiveInterval = setInterval(()=>{
  if(homeScreen.classList.contains("active")){
    renderCustomerList(customers);
  }
}, 1000);
}

/* RENDER HOME CUSTOMER LIST */
function renderCustomerList(list) {
  customerList.innerHTML = "";
  const customerOnlyCount = customers.filter(
  c => (c.userType || "customer") === "customer"
).length;

const supplierOnlyCount = customers.filter(
  c => (c.userType || "customer") === "supplier"
).length;

customerCount.textContent =
  `${formatBanglaNumber(customerOnlyCount)} / সাপ্লায়ার ${formatBanglaNumber(supplierOnlyCount)}`;

  if (list.length === 0) {
    customerList.innerHTML =
      `<div style="text-align:center;padding:40px;color:#777;">কোনো গ্রাহক পাওয়া যায়নি</div>`;
    return;
  }

list.sort((a,b)=>
  ((b.lastActivityAt || b.createdAt || 0) -
   (a.lastActivityAt || a.createdAt || 0))
);
  list.forEach(cust => {
    const div = document.createElement("div");
    div.className = "customer-item";

    const bal = cust.computedBalance || 0;
    const absBal = Math.abs(bal);
const amountClass =
  bal < 0 ? "green-amount" :
  bal > 0 ? "red-amount" :
  "zero-amount";

    let timeText = "এইমাত্র";

    const refTime = cust.lastActivityAt || cust.createdAt || Date.now();
    const diffMs = Date.now() - refTime;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    const secs = Math.floor(diffMs / 1000);

if (secs < 5) {
  timeText = "এইমাত্র";
} else if (secs < 60) {
  timeText = `${formatBanglaNumber(secs)} সেকেন্ড`;
} else if (mins < 60) {
  timeText = `${formatBanglaNumber(mins)} মিনিট`;
} else if (hours < 24) {
  timeText = `${formatBanglaNumber(hours)} ঘণ্টা`;
} else {
  timeText = `${formatBanglaNumber(days)} দিন`;
}

    div.innerHTML = `
      <div class="cust-left">
        <div class="avatar" style="background:${cust.avatarColor || '#d9e2f3'};">
  ${
    cust.avatarImage
      ? `<img src="${cust.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
      : (
          cust.name.trim().length >= 2
            ? cust.name.trim().substring(0,2).toUpperCase()
            : cust.name.trim().charAt(0).toUpperCase()
        )
  }
</div>

        <div>
          <div class="cust-name">${cust.name}</div>
          <div class="cust-time">${timeText}</div>
        </div>
      </div>

<div class="cust-right">
  <span class="cust-amount ${amountClass}">${money(absBal)}</span>
  <i class="fa-solid fa-chevron-right"></i>
</div>
    `;

    div.onclick = () => openLedger(cust);
    customerList.appendChild(div);
  });
}

/* DASHBOARD SUMMARY CALCULATOR */
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

/* LIVE TIME COUNTER LOOP */
function startLiveTimer(cust, txns) {
  if (liveInterval) clearInterval(liveInterval);
  
  function updateTime() {
    let referenceTime = cust.createdAt || Date.now();
    if (cust.lastActivityAt) {
  referenceTime = cust.lastActivityAt;
} else if (txns && txns.length > 0) {
  referenceTime = txns[0].createdAt;
}
    
    const diffMs = Date.now() - referenceTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (!liveTimeCounter) return;

    const diffSecs = Math.floor(diffMs / 1000);

if (diffSecs < 5) {
  liveTimeCounter.textContent = "(এইমাত্র)";
} else if (diffSecs < 60) {
  liveTimeCounter.textContent =
    `(${formatBanglaNumber(diffSecs)} সেকেন্ড আগে)`;
} else if (diffMins < 60) {
  liveTimeCounter.textContent =
    `(${formatBanglaNumber(diffMins)} মিনিট আগে)`;
} else if (diffHours < 24) {
  liveTimeCounter.textContent =
    `(${formatBanglaNumber(diffHours)} ঘণ্টা আগে)`;
} else {
  liveTimeCounter.textContent =
    `(${formatBanglaNumber(diffDays)} দিন আগে)`;
}
  }
  
  updateTime();
  liveInterval = setInterval(updateTime, 1000); 
}

/* LEDGER DETAILS VIEW */
async function openLedger(customer) {
closeTransientUI();
  currentCustomer = customer;
  switchScreen(ledgerScreen);
history.pushState({screen:"ledger"}, "");
  
  ledgerName.textContent = customer.name;

if(customer.avatarImage){
  ledgerAvatar.innerHTML = `<img src="${customer.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
  ledgerAvatar.style.background = "transparent";
}else{
  ledgerAvatar.textContent =
    customer.name.trim().length >= 2
      ? customer.name.trim().substring(0,2).toUpperCase()
      : customer.name.trim().charAt(0).toUpperCase();

  ledgerAvatar.style.background = customer.avatarColor || "#0b61a4";
}

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

  // Transaction History List Render
  const transactionList = document.getElementById("transactionList");
  if (transactionList) {
    transactionList.innerHTML = "";
    txns.forEach(txn => {
      const div = document.createElement("div");
      div.className = "transaction-item";
      
      const amount = txn.give > 0 ? txn.give : txn.receive;
      const cls = txn.give > 0 ? "give" : "receive";
      const label = txn.give > 0 ? "দিলাম" : "পেলাম";

      div.innerHTML = `
        <div class="txn-note">${txn.note || "লেনদেন"}</div>
        <div class="txn-amount ${cls}">${label}: ৳ ${money(amount)}</div>
      `;

      // Long press or right click to delete transaction
      div.oncontextmenu = async (e) => {
        e.preventDefault();
        if (confirm("এই লেনদেনটি ডিলিট করতে চান?")) {
          await deleteTransaction(txn.id);
          await loadDashboard();
          const updated = customers.find(c => c.id === currentCustomer.id);
          if (updated) openLedger(updated);
        }
      };
      transactionList.appendChild(div);
    });
  }

  // Report Sheet Build
  if (reportTxnList) {
    reportTxnList.innerHTML = "";
    let totalGaveSum = 0;
    let totalGotSum = 0;

    if (customer.openingBalance && customer.openingBalance !== 0) {
      const row = document.createElement("div");
      row.className = "report-row";
      const opDate = new Date(customer.createdAt || Date.now());
      
      let gaveVal = customer.openingBalance > 0 ? customer.openingBalance : 0;
      let gotVal = customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0;
      totalGaveSum += gaveVal;
      totalGotSum += gotVal;

      row.innerHTML = `
        <div class="rep-details">
          <div class="rep-date">${formatDateBangla(opDate)}</div>
          <div class="rep-time">${formatTimeBangla(opDate)}</div>
          <div class="rep-note">শুরুর ব্যালেন্স</div>
        </div>
        <div class="rep-gave">${gaveVal > 0 ? money(gaveVal) : ""}</div>
        <div class="rep-got">${gotVal > 0 ? money(gotVal) : ""}</div>
      `;
      reportTxnList.appendChild(row);
    }

    const reversedTxns = [...txns];
    reversedTxns.forEach(txn => {
      const row = document.createElement("div");
      row.className = "report-row";
      const tDate = new Date(txn.createdAt);

      if (txn.give > 0) totalGaveSum += txn.give;
      if (txn.receive > 0) totalGotSum += txn.receive;

      row.innerHTML = `
        <div class="rep-details">
          <div class="rep-date">${formatDateBangla(tDate)}</div>
          <div class="rep-time">${formatTimeBangla(tDate)}</div>
          <div class="rep-note">${txn.note || "লেনদেন"}</div>
        </div>
        <div class="rep-gave">${txn.give > 0 ? money(txn.give) : ""}</div>
        <div class="rep-got">${txn.receive > 0 ? money(txn.receive) : ""}</div>
      `;
      reportTxnList.appendChild(row);
    });

    if (reportTotalGave) reportTotalGave.textContent = money(totalGaveSum);
    if (reportTotalGot) reportTotalGot.textContent = money(totalGotSum);
  }
}

/* 3-DOT CONTEXT MENU ACTIONS */
if (deleteCustomerBtn) {
  deleteCustomerBtn.onclick = (e) => {
    e.stopPropagation();
    if (threeDotMenu) threeDotMenu.classList.toggle("active");
  };
}

document.addEventListener("click", () => {
  if (threeDotMenu) threeDotMenu.classList.remove("active");
});

if (optTagada) {
  optTagada.onclick = () => {
    alert(`"${currentCustomer.name}" এর মোবাইলে তাগাদা মেসেজ পাঠানো হয়েছে!`);
  };
}

if (optReport) {
  optReport.onclick = () => {
    if (reportViewContainer) reportViewContainer.style.display = "flex";
  };
}
if (closeReportBtn) {
  closeReportBtn.onclick = () => {
    if (reportViewContainer) reportViewContainer.style.display = "none";
  };
}

if (optEdit) {
  optEdit.onclick = () => {
    editState.isEditMode = true;
window.__editModeActive = true;

editState.draft = {
  id: currentCustomer.id,
  userType: currentCustomer.userType || "customer",
  name: currentCustomer.name || "",
  phone: currentCustomer.phone || "",
  avatarImage: currentCustomer.avatarImage || ""
};

    customerFormTitle.textContent =
  currentCustomer?.userType === "supplier"
    ? "সাপ্লায়ার এডিট"
    : "কাস্টমার এডিট";

saveCustomerBtn.textContent = "পরবর্তী";
saveCustomerBtn.classList.remove("active");

    customerName.value = currentCustomer.name || "";
    customerPhone.value = currentCustomer.phone || "";

window.onAvatarChanged = updateEditValidation;

customerName.oninput = window.onAvatarChanged;
customerPhone.oninput = window.onAvatarChanged;
    if(customerOpening){
  customerOpening.value = currentCustomer.openingBalance || "";
}

    document.getElementById("customerNameBox").classList.add("has-value");
    document.getElementById("customerPhoneBox").classList.add("has-value");

    getCustomerUIState().userType = currentCustomer.userType || "customer";
    getCustomerUIState().avatarImage = currentCustomer.avatarImage || "";
    getCustomerUIState().attachedPhoto = currentCustomer.attachedPhoto || "";

    const avatarPreviewEl = document.getElementById("customerAvatarPreview");
const avatarIconEl = document.getElementById("customerAvatarIcon");

if(currentCustomer.avatarImage){
  avatarPreviewEl.src = currentCustomer.avatarImage;
  avatarPreviewEl.style.display = "block";
  avatarIconEl.style.display = "none";
}else{
  avatarPreviewEl.src = "";
  avatarPreviewEl.style.display = "none";
  avatarIconEl.src = "assets/svg/avatar-user.svg";
  avatarIconEl.style.display = "block";
}

    if (openingBalContainer) openingBalContainer.style.display = "none";

    switchScreen(customerFormScreen);
    history.pushState({screen:"form"}, "");
  };
}

if (optDelete) {
  optDelete.onclick = async () => {
    if (confirm(`আপনি কি নিশ্চিতভাবে "${currentCustomer.name}" কে সম্পূর্ণ ডিলিট করতে চান?`)) {
      if (liveInterval) clearInterval(liveInterval);
      await deleteCustomer(currentCustomer.id);
      currentCustomer = null;
      await loadDashboard();
      switchScreen(homeScreen);
    }
  };
}

/* SAVE NEW TRANSACTION */
if (saveTxnBtn) {
  saveTxnBtn.onclick = async () => {
    const giveVal = parseFloat(txnGive.value) || 0;
    const recVal = parseFloat(txnReceive.value) || 0;
    const noteVal = txnNote.value.trim();

    if (giveVal === 0 && recVal === 0) {
      alert("অনুগ্রহ করে সঠিক অংক লিখুন!");
      return;
    }

    const newTxn = {
      id: Date.now().toString(),
      customerId: currentCustomer.id,
      give: giveVal,
      receive: recVal,
      note: noteVal,
      createdAt: selectedTxnDate.getTime()
    };

    await addTransaction(newTxn);

currentCustomer.lastActivityAt = Date.now();
await updateCustomer(currentCustomer);
    
    txnGive.value = "";
    txnReceive.value = "";
    txnNote.value = "";

    document.getElementById("txnGiveBox")?.classList.remove("active","has-value");
    document.getElementById("txnReceiveBox")?.classList.remove("active","has-value");
    document.getElementById("txnNoteBox")?.classList.remove("active","has-value");

    const ledgerFooter = document.querySelector(".ledger-save-footer");

    if(ledgerFooter){
      ledgerFooter.style.transform = "translateX(-50%)";
    }

    updateSaveBtnState();

    selectedTxnDate = new Date();
    updateTxnDateButton();

    await loadDashboard();
    const updatedCust = customers.find(c => c.id === currentCustomer.id);
    if (updatedCust) {
      await openLedger(updatedCust);
    }
  };
}

/* CUSTOMER ADD & UPDATE HANDLER */
if (saveCustomerBtn) {
  saveCustomerBtn.onclick = async (e) => {
    if (e) e.preventDefault();
    
    const name = customerName.value.trim();
    const phone = customerPhone.value.trim();
    const opening = customerOpening
  ? (parseFloat(customerOpening.value) || 0)
  : 0;

    if (!name) {
      alert("অনুগ্রহ করে গ্রাহকের নাম লিখুন!");
      return;
    }

    if (editState.isEditMode) {
  if(name.length < 3 || name.length > 35){
    return;
  }
  editState.draft.name = name;
  editState.draft.phone = phone;
  editState.draft.avatarImage = getCustomerUIState().avatarImage || "";

  showEditConfirmScreen();
  return;
} else {
     
 const avatarColors = ["#c8e6c9", "#f3e5ab", "#d9e2f3", "#f6d6dc"];
 const lastColor = customers.length
  ? customers[customers.length - 1].avatarColor
  : null;

const availableColors = avatarColors.filter(
  color => color !== lastColor
);

const randomColor =
  availableColors[
    Math.floor(Math.random() * availableColors.length)
  ];

const newCust = {
  id: Date.now().toString(),
  name: name,
  phone: phone,
  openingBalance: opening,
  createdAt: Date.now(),
  avatarColor: randomColor,

  userType: getCustomerUIState().userType || "customer",
  avatarImage: getCustomerUIState().avatarImage || "",
  attachedPhoto: getCustomerUIState().attachedPhoto || "",
  selectedDate: getCustomerUIState().selectedDate
    ? getCustomerUIState().selectedDate.getTime()
    : Date.now()
};
      
      await addCustomer(newCust);
await loadDashboard();

showCustomerSuccess(`${name} যোগ করা হয়েছে`);

customerName.value = "";
customerPhone.value = "";
customerOpening.value = "";

getCustomerUIState().avatarImage = "";
getCustomerUIState().attachedPhoto = "";
getCustomerUIState().userType = "customer";
getCustomerUIState().selectedDate = new Date();

document.getElementById("customerAvatarPreview").style.display = "none";
document.getElementById("customerAvatarIcon").style.display = "block";

const saved = customers.find(c => c.id === newCust.id);

setTimeout(async ()=>{
  await openLedger(saved || newCust);
}, 2100);
    }
  };
}

function updateAddCustomerValidation(){
  if(!addCustomerName || !addSaveCustomerBtn) return;

  const name = addCustomerName.value.trim();
  const warning = document.getElementById("addCustomerNameWarning");
  const error = document.getElementById("addCustomerNameError");
  const openingBox = document.getElementById("addOpeningBalContainer");

  if(name.length >= 3 && name.length <= 35){
    addSaveCustomerBtn.classList.add("active");

    if(warning) warning.style.display = "none";
    if(error) error.style.display = "none";

    if(openingBox) openingBox.style.display = "flex";
  }else{
    addSaveCustomerBtn.classList.remove("active");

    if(name.length > 0){
      if(warning) warning.style.display = "block";
      if(error) error.style.display = "block";
    }else{
      if(warning) warning.style.display = "none";
      if(error) error.style.display = "none";
    }

    if(openingBox) openingBox.style.display = "none";
  }
}

if (addSaveCustomerBtn) {
  addSaveCustomerBtn.onclick = async (e) => {
    if (e) e.preventDefault();

    const name = addCustomerName.value.trim();
    const phone = addCustomerPhone.value.trim();
    const opening = parseFloat(addCustomerOpening.value) || 0;

    if (name.length < 3 || name.length > 35) {
      return;
    }

    const avatarColors = ["#c8e6c9", "#f3e5ab", "#d9e2f3", "#f6d6dc"];
    const lastColor = customers.length
      ? customers[customers.length - 1].avatarColor
      : null;

    const availableColors = avatarColors.filter(
      color => color !== lastColor
    );

    const randomColor =
      availableColors[
        Math.floor(Math.random() * availableColors.length)
      ];

    const newCust = {
      id: Date.now().toString(),
      name,
      phone,
      openingBalance: opening,
      createdAt: Date.now(),
      avatarColor: randomColor,
      userType: "customer"
    };

    await addCustomer(newCust);
    await loadDashboard();

    switchScreen(homeScreen);
  };
}

function resetCustomerAddUI(){
  addCustomerName.value = "";
  addCustomerPhone.value = "";
  addCustomerOpening.value = "";

  addCustomerState.avatarImage = "";
  addCustomerState.userType = "customer";

  addCustomerNameBox?.classList.remove("active","has-value");
  addCustomerPhoneBox?.classList.remove("active","has-value");

  if(addOpeningBalContainer){
    addOpeningBalContainer.style.display = "none";
    addOpeningBalContainer.classList.remove("active","has-value");
  }

  if(addCustomerAvatarPreview){
    addCustomerAvatarPreview.src = "";
    addCustomerAvatarPreview.style.display = "none";
  }

  if(addCustomerAvatarIcon){
    addCustomerAvatarIcon.style.display = "block";
  }

  document.getElementById("addCustomerNameWarning").style.display = "none";
  document.getElementById("addCustomerNameError").style.display = "none";

  addSaveCustomerBtn?.classList.remove("active");
}

if(backFromCustomerAdd){
  backFromCustomerAdd.onclick = async ()=>{
    resetCustomerAddUI();

    await loadDashboard();
    switchScreen(homeScreen);
  };
}

if (openCustomerModal) {
  openCustomerModal.onclick = () => {
    switchScreen(customerAddScreen);
    history.pushState({screen:"add"}, "");
  };
}

/* NAVIGATION BACKS */
document.addEventListener("click", async (e)=>{
  const backBtn = e.target.closest(".back-btn");

  if(!backBtn) return;

  e.preventDefault();
  e.stopPropagation();

  await handleUniversalBack();
});

/* LIVE SEARCH */
if (searchInput) {
  searchInput.oninput = () => {
    const q = searchInput.value.toLowerCase();
    const filtered = customers.filter(c => c.name.toLowerCase().includes(q));
    renderCustomerList(filtered);
  };
}

/* UTILS & MATH COMPUTATION */

function updateTxnDateButton() {
  if (txnDateBtn) {
    txnDateBtn.innerHTML = `
      <img src="assets/svg/calendar.svg" class="calendar-icon" alt="Calendar">
      ${selectedTxnDate.toLocaleDateString("bn-BD", {
        day:"numeric",
        month:"short"
      })}
    `;
  }
}

if (txnDateBtn) {
  txnDateBtn.onclick = () => {
    txnDate.value = selectedTxnDate.toISOString().split("T")[0];
    if (txnDate.showPicker) txnDate.showPicker();
  };
}

if (txnDate) {
  txnDate.onchange = () => {
    if (txnDate.value) {
      selectedTxnDate = new Date(txnDate.value);
      updateTxnDateButton();
    }
  };
}

window.onpopstate = async function () {
  const confirmScreen = document.getElementById("editConfirmScreen");

  if(confirmScreen && confirmScreen.classList.contains("show")){
    confirmScreen.classList.remove("show");

    editState.isEditMode = false;
    editState.draft = null;
    window.onAvatarChanged = null;
    window.__editModeActive = false;

    return;
  }

  const handled = await handleUniversalBack();

  if(handled){
    history.pushState({screen:"ui"}, "");
  }
};

const inlineCalculator = document.getElementById("inlineCalculator");

function isTextInput(el){
  return !!(
    el &&
    (
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA"
    )
  );
}

function hideCalculator(){
  inlineCalculator.classList.remove("show");
  activeMoneyInput = null;

  const footer = document.querySelector(".ledger-save-footer");
  if(footer){
    footer.style.transform = "translateX(-50%)";
  }
}

function hideKeyboard(){
  return;
}

function closeTransientUI(){
  hideCalculator();
  hideKeyboard();

  if(txnGive) txnGive.value = "";
  if(txnReceive) txnReceive.value = "";
  if(txnNote) txnNote.value = "";

  document.getElementById("txnGiveBox")?.classList.remove("active","has-value");
  document.getElementById("txnReceiveBox")?.classList.remove("active","has-value");
  document.getElementById("txnNoteBox")?.classList.remove("active","has-value");

  updateSaveBtnState();
}

function hasTransientUIOpen(){
  return (
    inlineCalculator.classList.contains("show") ||
    isTextInput(document.activeElement)
  );
}

async function handleUniversalBack(){

  if(hasTransientUIOpen()){

  if(inlineCalculator.classList.contains("show")){
    hideCalculator();
    return true;
  }

  if(isTextInput(document.activeElement)){
    document.activeElement.blur();
    return true;
  }
}

  if(customerAddScreen.classList.contains("active")){
    resetCustomerAddUI();
    currentCustomer = null;
    await loadDashboard();
    switchScreen(homeScreen);
    return true;
  }

  if(customerFormScreen.classList.contains("active")){
    editState.isEditMode = false;
    editState.draft = null;
    window.onAvatarChanged = null;
    window.__editModeActive = false;

    const updated = customers.find(c => c.id === currentCustomer?.id);

    if(updated || currentCustomer){
      await openLedger(updated || currentCustomer);
    }else{
      await loadDashboard();
      switchScreen(homeScreen);
    }

    return true;
  }

  if(ledgerScreen.classList.contains("active")){
    if(liveInterval) clearInterval(liveInterval);
    await loadDashboard();
    switchScreen(homeScreen);
    return true;
  }

  return false;
}

moneyInputs.forEach(input=>{
  const activateInput = ()=>{
  activeMoneyInput = input;
  calcExpression = input.value || "";

  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);

  inlineCalculator.classList.add("show");
};

  input.addEventListener("pointerdown", activateInput);
});

calcKeys.forEach(key=>{
  key.addEventListener("click", ()=>{
    if(!activeMoneyInput) return;

    const val = key.dataset.key;

    if(val === "AC"){
      calcExpression = "";
    }
    else if(val === "BACK"){
      calcExpression = calcExpression.slice(0,-1);
    }
    
else if(val === "="){
  try{
    const safeExpr = calcExpression
      .replace(/×/g,"*")
      .replace(/÷/g,"/");

    if(!/^[0-9+\-*/%.() ]+$/.test(safeExpr)){
      throw new Error("Invalid");
    }

    calcExpression = String(
      Function(
        "return (" + safeExpr.replace(/%/g,"/100") + ")"
      )()
    );

    activeMoneyInput.value = calcExpression;
activeMoneyInput.focus();
activeMoneyInput.setSelectionRange(
  activeMoneyInput.value.length,
  activeMoneyInput.value.length
);
updateSaveBtnState();
  }catch{
    calcExpression = "";
    activeMoneyInput.value = "";
  }
}

    else{
      calcExpression += val;
    }

    activeMoneyInput.value = calcExpression;
activeMoneyInput.focus();
activeMoneyInput.setSelectionRange(
  activeMoneyInput.value.length,
  activeMoneyInput.value.length
);
updateSaveBtnState();
  });
});

if(txnNote){
  txnNote.addEventListener("focus", ()=>{
    hideCalculator();
  });
}

document.addEventListener("focusin",(e)=>{
  if(
    isTextInput(e.target) &&
    !e.target.classList.contains("money-input")
  ){
    hideCalculator();
  }
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    const footer = document.getElementById("customerSaveFooter");
    const formScreen = document.getElementById("customerFormScreen");

    if (!footer || !formScreen.classList.contains("active")) return;

    const vh = window.visualViewport.height;
    const full = window.innerHeight;

    if (vh < full * 0.85) {
      footer.style.bottom =
        (full - window.visualViewport.offsetTop - vh) + "px";
    } else {
      footer.style.bottom = "0px";
    }
  });
}

function showEditConfirmScreen(){
  const screen = document.getElementById("editConfirmScreen");
  const title = document.getElementById("editConfirmTitle");
  const avatar = document.getElementById("editConfirmAvatar");
  const defaultAvatar = document.getElementById("editConfirmDefaultAvatar");
  const nameEl = document.getElementById("editConfirmName");
  const phoneEl = document.getElementById("editConfirmPhone");

  title.textContent =
  editState.draft.userType === "supplier"
      ? "সাপ্লায়ার এডিট"
      : "কাস্টমার এডিট";

  nameEl.textContent = editState.draft.name || "";
  phoneEl.textContent = editState.draft.phone || "";

  if(editState.draft.avatarImage){
    avatar.src = editState.draft.avatarImage;
    avatar.style.display = "block";
    defaultAvatar.style.display = "none";
  }else{
    avatar.src = "";
    avatar.style.display = "none";
    defaultAvatar.style.display = "block";
  }

  screen.classList.add("show");
}

document.getElementById("backFromEditConfirm").onclick = ()=>{
  document.getElementById("editConfirmScreen").classList.remove("show");
};

document.getElementById("confirmEditBtn").onclick = async ()=>{
  if(!currentCustomer || !editState.draft) return;

  const savedDraft = {...editState.draft};

  currentCustomer.name = savedDraft.name;
  currentCustomer.phone = savedDraft.phone;
  currentCustomer.avatarImage = savedDraft.avatarImage || "";
  currentCustomer.userType = savedDraft.userType || "customer";

  await updateCustomer(currentCustomer);
  await loadDashboard();

  document.getElementById("editConfirmScreen").classList.remove("show");

  showCustomerSuccess(
    currentCustomer.userType === "supplier"
      ? "সাপ্লায়ারের তথ্য আপডেট করা হয়েছে।"
      : "কাস্টমারের তথ্য আপডেট করা হয়েছে।"
  );

  setTimeout(()=>{
    editState.isEditMode = false;
    editState.draft = null;
    window.onAvatarChanged = null;
    window.__editModeActive = false;

    currentCustomer = null;
    switchScreen(homeScreen);
  }, 2100);
};

function setupLedgerKeyboardLift(){
  const footer = document.querySelector(".ledger-save-footer");
  if(!footer) return;

  function resetFooter(){
    footer.style.transform = "translateX(-50%)";
  }

  function raiseFooterForCalculator(){
    setTimeout(() => {
      const calc = document.getElementById("inlineCalculator");
      const calcHeight = calc && calc.offsetHeight > 0 ? calc.offsetHeight : 280;
      footer.style.transform = `translateX(-50%) translateY(-${calcHeight}px)`;
    }, 50);
  }

  function updateKeyboardFooter(){
    if(!window.visualViewport){
      resetFooter();
      return;
    }

    const keyboardHeight =
      window.innerHeight - window.visualViewport.height;

    if(document.activeElement === txnNote && keyboardHeight > 120){
      footer.style.transform =
        `translateX(-50%) translateY(-${keyboardHeight}px)`;
    }else{
      resetFooter();
    }
  }

  if(txnGive){
    txnGive.addEventListener("focus", raiseFooterForCalculator);
  }

  if(txnReceive){
    txnReceive.addEventListener("focus", raiseFooterForCalculator);
  }

  if(txnNote){
    txnNote.addEventListener("focus", updateKeyboardFooter);

    txnNote.addEventListener("blur", ()=>{
      setTimeout(resetFooter,150);
    });
  }

  if(window.visualViewport){
    window.visualViewport.addEventListener(
      "resize",
      updateKeyboardFooter
    );
  }

  document.addEventListener("click",(e)=>{
    if(
      !e.target.closest(".transaction-form") &&
      !e.target.closest(".inline-calculator")
    ){
      resetFooter();
    }
  });
}
