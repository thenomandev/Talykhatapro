let customers = [];
let currentCustomer = null;
let selectedTxnDate = new Date();
let liveInterval = null;
let isEditMode = false;
let editDraft = null;

/* ELEMENTS */
const homeScreen = document.getElementById("homeScreen");
const customerFormScreen = document.getElementById("customerFormScreen");
const ledgerScreen = document.getElementById("ledgerScreen");
const editCustomerScreen = document.getElementById("editCustomerScreen");

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
const customerDatePicker = document.getElementById("customerDatePicker");

const editCustomerTitle = document.getElementById("editCustomerTitle");
const editCustomerName = document.getElementById("editCustomerName");
const editCustomerPhone = document.getElementById("editCustomerPhone");
const editSaveBtn = document.getElementById("editSaveBtn");

const editCustomerNameBox = document.getElementById("editCustomerNameBox");
const editCustomerPhoneBox = document.getElementById("editCustomerPhoneBox");

const backFromEditCustomer = document.getElementById("backFromEditCustomer");

const editCustomerAvatarIcon = document.getElementById("editCustomerAvatarIcon");
const editCustomerAvatarPreview = document.getElementById("editCustomerAvatarPreview");
const editAvatarBadgeIcon = document.getElementById("editAvatarBadgeIcon");
const editOpenAvatarPickerBtn = document.getElementById("editOpenAvatarPickerBtn");

if(window.setupEditFloating){
  window.setupEditFloating(editCustomerName, editCustomerNameBox);
  window.setupEditFloating(editCustomerPhone, editCustomerPhoneBox);
}

const avatarPickerBackdrop = document.getElementById("avatarPickerBackdrop");
const avatarPickerSheet = document.getElementById("avatarPickerSheet");
const pickCameraBtn = document.getElementById("pickCameraBtn");
const pickGalleryBtn = document.getElementById("pickGalleryBtn");
const deleteAvatarBtn = document.getElementById("deleteAvatarBtn");
const customerCameraInput = document.getElementById("customerCameraInput");
const customerGalleryInput = document.getElementById("customerGalleryInput");

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

  const hasAmount =
    (parseFloat(txnGive.value) || 0) > 0 ||
    (parseFloat(txnReceive.value) || 0) > 0;

  if(hasAmount){
    saveTxnBtn.classList.add("active");
  }else{
    saveTxnBtn.classList.remove("active");
  }
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
  initPremiumCustomerUI();
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

    if (mins < 1) {
      timeText = "এইমাত্র";
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
          ${cust.name.trim().length >= 2
  ? cust.name.trim().substring(0,2).toUpperCase()
  : cust.name.trim().charAt(0).toUpperCase()}
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
    if (txns && txns.length > 0) {
      referenceTime = txns[0].createdAt; 
    }
    
    const diffMs = Date.now() - referenceTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (!liveTimeCounter) return;

    if (diffMins < 1) {
      liveTimeCounter.textContent = "(এইমাত্র)";
    } else if (diffMins < 60) {
      liveTimeCounter.textContent = `(${formatBanglaNumber(diffMins)} মিনিট আগে)`;
    } else if (diffHours < 24) {
      liveTimeCounter.textContent = `(${formatBanglaNumber(diffHours)} ঘণ্টা আগে)`;
    } else {
      liveTimeCounter.textContent = `(${formatBanglaNumber(diffDays)} দিন আগে)`;
    }
  }
  
  updateTime();
  liveInterval = setInterval(updateTime, 30000); 
}

/* LEDGER DETAILS VIEW */
async function openLedger(customer) {
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

    const reversedTxns = [...txns].reverse();
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

    isEditMode = true;

    editDraft = {
      id: currentCustomer.id,
      userType: currentCustomer.userType || "customer",
      name: currentCustomer.name || "",
      phone: currentCustomer.phone || "",
      avatarImage: currentCustomer.avatarImage || ""
    };

    editCustomerTitle.textContent =
      currentCustomer?.userType === "supplier"
        ? "সাপ্লায়ার এডিট"
        : "কাস্টমার এডিট";

    editCustomerName.value = editDraft.name;
    editCustomerPhone.value = editDraft.phone;

    editCustomerNameBox.classList.add("has-value");
    editCustomerPhoneBox.classList.add("has-value");

    if(editDraft.avatarImage){
      editCustomerAvatarPreview.src = editDraft.avatarImage;
      editCustomerAvatarPreview.style.display = "block";
      editCustomerAvatarIcon.style.display = "none";

      editAvatarBadgeIcon.src = "assets/svg/pen.svg";
    }else{
      editCustomerAvatarPreview.style.display = "none";
      editCustomerAvatarIcon.style.display = "block";

      editAvatarBadgeIcon.src = "assets/svg/mini-camera.svg";
    }

editSaveBtn.classList.remove("active");
document.getElementById("editCustomerNameWarning").style.display = "none";
document.getElementById("editCustomerNameError").style.display = "none";

if(window.setupEditFloating){
  window.setupEditFloating(editCustomerName, editCustomerNameBox);
  window.setupEditFloating(editCustomerPhone, editCustomerPhoneBox);
}
    switchScreen(editCustomerScreen);
    history.pushState({screen:"edit"}, "");
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
if(editSaveBtn){
  editSaveBtn.onclick = () => {
    const name = editCustomerName.value.trim();

    const warning = document.getElementById("editCustomerNameWarning");
    const error = document.getElementById("editCustomerNameError");

    if(name.length < 3 || name.length > 35){
      warning.style.display = "block";
      error.style.display = "block";
      return;
    }else{
      warning.style.display = "none";
      error.style.display = "none";
    }

    const changed =
      name !== (currentCustomer?.name || "") ||
      editCustomerPhone.value.trim() !== (currentCustomer?.phone || "") ||
      (editDraft?.avatarImage || "") !== (currentCustomer?.avatarImage || "");

    if(!changed) return;

    editDraft.name = name;
    editDraft.phone = editCustomerPhone.value.trim();

    showEditConfirmScreen();
  };

  function checkEditChanges(){
    const name = editCustomerName.value.trim();

    const warning = document.getElementById("editCustomerNameWarning");
    const error = document.getElementById("editCustomerNameError");

    if(name.length > 0 && (name.length < 3 || name.length > 35)){
      warning.style.display = "block";
      error.style.display = "block";
    }else{
      warning.style.display = "none";
      error.style.display = "none";
    }

    const changed =
      name !== (currentCustomer?.name || "") ||
      editCustomerPhone.value.trim() !== (currentCustomer?.phone || "") ||
      (editDraft?.avatarImage || "") !== (currentCustomer?.avatarImage || "");

    if(changed && name.length >= 3 && name.length <= 35){
      editSaveBtn.classList.add("active");
    }else{
      editSaveBtn.classList.remove("active");
    }
  }

  window.checkEditChanges = checkEditChanges;

  editCustomerName.oninput = checkEditChanges;
  editCustomerPhone.oninput = checkEditChanges;
}

if(backFromEditCustomer){
  backFromEditCustomer.onclick = () => {
    switchScreen(ledgerScreen);
  };
}

if(editOpenAvatarPickerBtn){
  editOpenAvatarPickerBtn.onclick = () => {
    const tempInput = document.createElement("input");
    tempInput.type = "file";
    tempInput.accept = "image/*";

    tempInput.onchange = e => {
      const file = e.target.files[0];
      if(!file) return;

      const reader = new FileReader();

      reader.onload = ev => {
        if(!editDraft) return;

        editDraft.avatarImage = ev.target.result;

        editCustomerAvatarPreview.src = ev.target.result;
        editCustomerAvatarPreview.style.display = "block";
        editCustomerAvatarIcon.style.display = "none";
        editAvatarBadgeIcon.src = "assets/svg/pen.svg";

        if(window.checkEditChanges){
          window.checkEditChanges();
        }
      };

      reader.readAsDataURL(file);
    };

    tempInput.click();
  };
}

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
    const opening = parseFloat(customerOpening.value) || 0;

    if (!name) {
      alert("অনুগ্রহ করে গ্রাহকের নাম লিখুন!");
      return;
    }

    if (isEditMode && currentCustomer) {
  editDraft.name = name;
  editDraft.phone = phone;
  editDraft.avatarImage = customerPremiumState.avatarImage || "";

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

  userType: customerPremiumState.userType || "customer",
  avatarImage: customerPremiumState.avatarImage || "",
  attachedPhoto: customerPremiumState.attachedPhoto || "",
  selectedDate: customerPremiumState.selectedDate
    ? customerPremiumState.selectedDate.getTime()
    : Date.now()
};
      
      await addCustomer(newCust);
await loadDashboard();

showCustomerSuccess(`${name} যোগ করা হয়েছে`);

customerName.value = "";
customerPhone.value = "";
customerOpening.value = "";

customerPremiumState.avatarImage = "";
customerPremiumState.attachedPhoto = "";
customerPremiumState.userType = "customer";
customerPremiumState.selectedDate = new Date();

document.getElementById("customerAvatarPreview").style.display = "none";
document.getElementById("customerAvatarIcon").style.display = "block";

const saved = customers.find(c => c.id === newCust.id);

setTimeout(async ()=>{
  await openLedger(saved || newCust);
}, 2100);
    }
  };
}

if (openCustomerModal) {
  openCustomerModal.onclick = () => {
  customerFormTitle.textContent = "নতুন কাস্টমার/সাপ্লায়ার";
saveCustomerBtn.textContent = "নিশ্চিত";
isEditMode = false;

  if(window.resetCustomerFormUI){
    resetCustomerFormUI();
  }

  switchScreen(customerFormScreen);
  history.pushState({screen:"form"}, "");
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
    txnDateBtn.textContent = "📅 " + selectedTxnDate.toLocaleDateString("bn-BD", { day: "numeric", month: "short" });
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
}

function hideKeyboard(){
  return;
}

function closeTransientUI(){
  hideCalculator();
  hideKeyboard();
}

function hasTransientUIOpen(){
  return (
    inlineCalculator.classList.contains("show") ||
    isTextInput(document.activeElement)
  );
}

async function handleUniversalBack(){
  if(hasTransientUIOpen()){
    closeTransientUI();

    if(ledgerScreen.classList.contains("active")){
      history.replaceState({screen:"ledger"}, "");
    }else if(customerFormScreen.classList.contains("active")){
      history.replaceState({screen:"form"}, "");
    }else{
      history.replaceState({screen:"home"}, "");
    }

    return true;
  }

  if(customerFormScreen.classList.contains("active")){
  if(window.resetCustomerFormUI){
    resetCustomerFormUI();
  }

  if(customerFormTitle.textContent === "নতুন কাস্টমার/সাপ্লায়ার"){
    currentCustomer = null;
    await loadDashboard();
    switchScreen(homeScreen);
  }else{
    switchScreen(ledgerScreen);
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
    const addFooter = document.getElementById("customerSaveFooter");
    const editFooter = document.querySelector(".edit-save-footer");

    const addScreen = document.getElementById("customerFormScreen");
    const editScreen = document.getElementById("editCustomerScreen");

    let footer = null;

    if(addScreen.classList.contains("active")){
      footer = addFooter;
    }else if(editScreen.classList.contains("active")){
      footer = editFooter;
    }

    if (!footer) return;

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
  if(!editDraft) return;
  const screen = document.getElementById("editConfirmScreen");
  const title = document.getElementById("editConfirmTitle");
  const avatar = document.getElementById("editConfirmAvatar");
  const defaultAvatar = document.getElementById("editConfirmDefaultAvatar");
  const nameEl = document.getElementById("editConfirmName");
  const phoneEl = document.getElementById("editConfirmPhone");

  title.textContent =
  editDraft.userType === "supplier"
      ? "সাপ্লায়ার এডিট"
      : "কাস্টমার এডিট";

  nameEl.textContent = editDraft.name || "";
  phoneEl.textContent = editDraft.phone || "";

  if(editDraft.avatarImage){
    avatar.src = editDraft.avatarImage;
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
  if(!currentCustomer || !editDraft) return;

  currentCustomer.name = editDraft.name;
  currentCustomer.phone = editDraft.phone;
  currentCustomer.avatarImage = editDraft.avatarImage || "";
  currentCustomer.userType = editDraft.userType || "customer";

  await updateCustomer(currentCustomer);

  document.getElementById("editConfirmScreen").classList.remove("show");

  showCustomerSuccess(
    currentCustomer.userType === "supplier"
      ? "সাপ্লায়ারের তথ্য আপডেট করা হয়েছে।"
      : "কাস্টমারের তথ্য আপডেট করা হয়েছে।"
  );

  await loadDashboard();

  const updated = customers.find(c => c.id === currentCustomer.id);

  setTimeout(async ()=>{
    await openLedger(updated || currentCustomer);
  }, 2100);
};
