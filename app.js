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
  initPremiumCustomerUI();
  setupLedgerFloatingUI();
  setupLedgerKeyboardLift();
  history.replaceState({screen:"home"}, "");
  history.pushState({screen:"ready"}, "");
});

/* RENDER HOME CUSTOMER LIST */

/* DASHBOARD SUMMARY CALCULATOR */

/* LIVE TIME COUNTER LOOP */

/* LEDGER DETAILS VIEW */

/* 3-DOT CONTEXT MENU ACTIONS */

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

    customerFormTitle.textContent =
  currentCustomer?.userType === "supplier"
    ? "সাপ্লায়ার এডিট"
    : "কাস্টমার এডিট";

saveCustomerBtn.textContent = "পরবর্তী";
saveCustomerBtn.classList.remove("active");

    customerName.value = currentCustomer.name || "";
    customerPhone.value = currentCustomer.phone || "";

window.checkEditChanges = () => {
  if(!isEditMode || !editDraft) return;

  const changed =
    customerName.value.trim() !== (editDraft.name || "") ||
    customerPhone.value.trim() !== (editDraft.phone || "") ||
    (customerPremiumState.avatarImage || "") !== (editDraft.avatarImage || "");

  if(changed){
    saveCustomerBtn.classList.add("active");
  }else{
    saveCustomerBtn.classList.remove("active");
  }
};

customerName.oninput = window.checkEditChanges;
customerPhone.oninput = window.checkEditChanges;
    customerOpening.value = currentCustomer.openingBalance || "";

    document.getElementById("customerNameBox").classList.add("has-value");
    document.getElementById("customerPhoneBox").classList.add("has-value");
    document.getElementById("openingBalContainer").classList.add("has-value");

    customerPremiumState.userType = currentCustomer.userType || "customer";
    customerPremiumState.avatarImage = currentCustomer.avatarImage || "";
    customerPremiumState.attachedPhoto = currentCustomer.attachedPhoto || "";

    const avatarPreviewEl = document.getElementById("customerAvatarPreview");
const avatarIconEl = document.getElementById("customerAvatarIcon");

if(currentCustomer.avatarImage){
  avatarPreviewEl.src = currentCustomer.avatarImage;
  avatarPreviewEl.style.display = "block";
  avatarIconEl.style.display = "none";
}else{
  avatarPreviewEl.src = "";
  avatarPreviewEl.style.display = "none";
  avatarIconEl.src = "assets/svg/pen.svg";
  avatarIconEl.style.display = "block";
}

    document.getElementById("customerTypeCustomer").classList.toggle(
      "active",
      customerPremiumState.userType === "customer"
    );

    document.getElementById("customerTypeSupplier").classList.toggle(
      "active",
      customerPremiumState.userType === "supplier"
    );

    if (openingBalContainer) openingBalContainer.style.display = "none";

    switchScreen(customerFormScreen);
    history.pushState({screen:"form"}, "");
  };
}

/* SAVE NEW TRANSACTION */

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

window.onpopstate = async function () {
  const handled = await handleUniversalBack();

  if(handled){
    history.pushState({screen:"ui"}, "");
  }
};

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
