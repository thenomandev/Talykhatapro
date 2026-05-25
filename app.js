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

/* SAVE NEW TRANSACTION */

/* CUSTOMER ADD & UPDATE HANDLER */

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
