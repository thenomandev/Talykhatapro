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

const moneyInputs = document.querySelectorAll(".money-input");
const calcKeys = document.querySelectorAll(".calc-key");
const inlineCalculator = document.getElementById("inlineCalculator");

const btnImportContact = document.getElementById("btnImportContact"); // ফোনবুক বাটন

let activeMoneyInput = null;
let calcExpression = "0";

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
  initFormValidation();
  initContactPicker(); // ফোনবুক ইন্টিগ্রেশন চালু করা হলো
  history.replaceState({screen:"home"}, "");
  history.pushState({screen:"ready"}, "");
});

/* OPTIMIZED FAST DASHBOARD LOAD */
async function loadDashboard() {
  customers = await getCustomers();
  
  // লুপের গতি বাড়ানোর জন্য Promise.all ব্যবহার করা হয়েছে যেন খুব দ্রুত লোড হয়
  await Promise.all(customers.map(async (cust) => {
    const txns = await getTransactions(cust.id);
    cust.computedBalance = calcBalance(cust, txns);
  }));
  
  renderCustomerList(customers);
  updateSummary();
}

/* RENDER HOME CUSTOMER LIST */
function renderCustomerList(list) {
  customerList.innerHTML = "";
  customerCount.textContent = `${formatBanglaNumber(list.length)} / সাপ্লায়ার ০`;

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
  ledgerAvatar.textContent =
    customer.name.trim().length >= 2
      ? customer.name.trim().substring(0,2).toUpperCase()
      : customer.name.trim().charAt(0).toUpperCase();

  ledgerAvatar.style.background = customer.avatarColor || "#0b61a4";

  if (threeDotMenu) threeDotMenu.classList.remove("active");
  if (reportViewContainer) reportViewContainer.style.display = "none";
  
  txnGive.value = "";
  txnReceive.value = "";
  txnNote.value = "";
  
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

  // Transaction History Rendering
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
}

/* FIXED LIVE VALIDATION & TOGGLE MECHANISM */
function initFormValidation() {
  const wrapperName = document.getElementById("nameWrapperCtx");
  const txtErrorName = document.getElementById("nameErrorTxtCtx");
  
  const pillCustomer = document.getElementById("pillCustomer");
  const pillSupplier = document.getElementById("pillSupplier");
  
  if (pillCustomer && pillSupplier) {
    const toggles = [pillCustomer, pillSupplier];
    toggles.forEach(pill => {
      pill.addEventListener("click", function() {
        toggles.forEach(p => p.classList.remove("active"));
        this.classList.add("active");
        const internalRadio = this.querySelector("input[type='radio']");
        if (internalRadio) internalRadio.checked = true;
      });
    });
  }

  // এই ফাংশনটি এখন সঠিকভাবে আইডিগুলো রিড করতে পারবে এবং এরর চলে যাবে
  function runLiveUiValidation() {
    if (!customerName || !customerPhone) return;

    const valName = customerName.value.trim();
    const valPhone = customerPhone.value.trim();
    let isNameValid = false;

    if (valName.length > 0 && valName.length < 3) {
      if (wrapperName) wrapperName.classList.add("wrapper-error-state");
      if (txtErrorName) txtErrorName.style.display = "block";
      isNameValid = false;
    } else {
      if (wrapperName) wrapperName.classList.remove("wrapper-error-state");
      if (txtErrorName) txtErrorName.style.display = "none";
      isNameValid = valName.length >= 3;
    }

    // মোবাইল নম্বরের স্ট্যান্ডার্ড ভ্যালিডেশন চেক (কমপক্ষে ১১ ডিজিট)
    const isPhoneValid = valPhone.length >= 11;

    // নাম ৩ অক্ষরের বেশি এবং ফোন নম্বর ঠিক থাকলে সেকশনগুলো দৃশ্যমান হবে ও বাটন কাজ করবে
    if (isNameValid && isPhoneValid) {
      if (openingBalContainer) openingBalContainer.classList.add("reveal-section");
      if (saveCustomerBtn) {
        saveCustomerBtn.removeAttribute("disabled");
        saveCustomerBtn.classList.add("active-state-btn");
      }
    } else {
      if (openingBalContainer) openingBalContainer.classList.remove("reveal-section");
      if (saveCustomerBtn) {
        saveCustomerBtn.setAttribute("disabled", "true");
        saveCustomerBtn.classList.remove("active-state-btn");
      }
    }
  }

  if (customerName && customerPhone) {
    customerName.addEventListener("input", runLiveUiValidation);
    customerPhone.addEventListener("input", runLiveUiValidation);
  }
}

/* PHONEBOOK IMPORT SYSTEM (WEB CONTACT PICKER) */
function initContactPicker() {
  if (!btnImportContact) return;

  btnImportContact.addEventListener("click", async () => {
    // চেক করা হচ্ছে ব্রাউজার বা ক্রোম কন্টাক্ট পিকিং সাপোর্ট করে কি না
    const props = ["name", "tel"];
    const opts = { multiple: false };

    if ("contacts" in navigator && "ContactsManager" in window) {
      try {
        const contacts = await navigator.contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          
          if (contact.name && contact.name.length > 0) {
            customerName.value = contact.name[0];
          }
          if (contact.tel && contact.tel.length > 0) {
            // স্পেস বা কান্ট্রি কোড ফরম্যাট ক্লিন করার জন্য রেগুলার এক্সপ্রেশন
            let cleanPhone = contact.tel[0].replace(/[^0-9+]/g, "");
            if (cleanPhone.startsWith("+88")) {
              cleanPhone = cleanPhone.replace("+88", "");
            }
            customerPhone.value = cleanPhone;
          }
          
          // ইনপুট ভ্যালু অ্যাসাইন করার পর ভ্যালিডেশন ফায়ার করার জন্য ট্রিগার
          customerName.dispatchEvent(new Event("input"));
        }
      } catch (err) {
        console.log("কন্টাক্ট সিলেক্ট করা হয়নি বা ক্যানসেল করা হয়েছে।", err);
      }
    } else {
      alert("দুঃখিত! আপনার ব্রাউজারটি ফোনবুক থেকে কন্টাক্ট সরাসরি যুক্ত করা সাপোর্ট করে না। অনুগ্রহ করে টাইপ করে লিখুন।");
    }
  });
}

/* SAVE CUSTOMER LOGIC TO INDEXEDDB */
if (saveCustomerBtn) {
  saveCustomerBtn.onclick = async () => {
    const nameVal = customerName.value.trim();
    const phoneVal = customerPhone.value.trim();
    const openingVal = parseFloat(customerOpening.value) || 0;

    if (nameVal.length < 3 || phoneVal.length < 11) return;

    const colors = ["#d9e2f3", "#d9f5d7", "#f7efc2", "#dfe7f7", "#f7dce0"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newCust = {
      id: "cust_" + Date.now(),
      name: nameVal,
      phone: phoneVal,
      openingBalance: openingVal,
      avatarColor: randomColor,
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    };

    await addCustomer(newCust);
    await loadDashboard();
    
    if (inlineCalculator) inlineCalculator.classList.remove("show");
    switchScreen(homeScreen);
  };
}

/* SAVE TRANSACTION LOGIC */
if (saveTxnBtn) {
  saveTxnBtn.onclick = async () => {
    if (!currentCustomer) return;

    const giveVal = parseFloat(txnGive.value) || 0;
    const receiveVal = parseFloat(txnReceive.value) || 0;
    const noteVal = txnNote.value.trim();

    if (giveVal === 0 && receiveVal === 0) {
      alert("অনুগ্রহ করে একটি অংক বসান!");
      return;
    }

    const newTxn = {
      id: "txn_" + Date.now(),
      customerId: currentCustomer.id,
      give: giveVal,
      receive: receiveVal,
      note: noteVal,
      createdAt: Date.now()
    };

    await addTransaction(newTxn);
    
    // Update Customer Activity
    currentCustomer.lastActivityAt = Date.now();
    await updateCustomer(currentCustomer);

    await loadDashboard();
    
    const updated = customers.find(c => c.id === currentCustomer.id);
    if (updated) openLedger(updated);

    if (inlineCalculator) inlineCalculator.classList.remove("show");
  };
}

/* SCREEN NAVIGATION LOGIC */
if (openCustomerModal) {
  openCustomerModal.onclick = () => {
    if(customerFormTitle) customerFormTitle.textContent = "নতুন কাস্টমার/সাপ্লায়ার";
    if(customerName) customerName.value = "";
    if(customerPhone) customerPhone.value = "";
    if(customerOpening) customerOpening.value = "";
    
    const wrapperName = document.getElementById("nameWrapperCtx");
    const txtErrorName = document.getElementById("nameErrorTxtCtx");
    if (wrapperName) wrapperName.classList.remove("wrapper-error-state");
    if (txtErrorName) txtErrorName.style.display = "none";
    if (openingBalContainer) openingBalContainer.classList.remove("reveal-section");
    if (saveCustomerBtn) {
      saveCustomerBtn.setAttribute("disabled", "true");
      saveCustomerBtn.classList.remove("active-state-btn");
    }
    
    switchScreen(customerFormScreen);
    history.pushState({screen:"form"}, "");
  };
}

if (backFromCustomerForm) {
  backFromCustomerForm.onclick = () => {
    if (inlineCalculator) inlineCalculator.classList.remove("show");
    switchScreen(homeScreen);
  };
}

if (backToHome) {
  backToHome.onclick = () => {
    if (inlineCalculator) inlineCalculator.classList.remove("show");
    if (liveInterval) clearInterval(liveInterval);
    switchScreen(homeScreen);
  };
}

/* THREE DOT MENU CONTROL */
if (deleteCustomerBtn) {
  deleteCustomerBtn.onclick = (e) => {
    e.stopPropagation();
    if (threeDotMenu) threeDotMenu.classList.toggle("active");
  };
}

document.addEventListener("click", () => {
  if (threeDotMenu) threeDotMenu.classList.remove("active");
});

if (optDelete) {
  optDelete.onclick = async () => {
    if (!currentCustomer) return;
    if (confirm(`আপনি কি নিশ্চিতভাবে "${currentCustomer.name}" কে ডিলিট করতে চান?`)) {
      await deleteCustomer(currentCustomer.id);
      await loadDashboard();
      switchScreen(homeScreen);
    }
  };
}

/* SEARCH SYSTEM */
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = customers.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));
    renderCustomerList(filtered);
  });
}

function updateTxnDateButton() {
  if (txnDateBtn) txnDateBtn.textContent = "📅 আজ";
}

/* INLINE KEYPAD CALCULATOR ENGINE FOR MONEY INPUTS */
moneyInputs.forEach(input => {
  const activateInput = (e) => {
    e.preventDefault();
    activeMoneyInput = input;
    calcExpression = input.value || "";
    
    moneyInputs.forEach(i => i.classList.remove("active-focus"));
    input.classList.add("active-focus");
    
    if (inlineCalculator) inlineCalculator.classList.add("show");
  };
  input.addEventListener("pointerdown", activateInput);
});

calcKeys.forEach(key => {
  key.addEventListener("click", () => {
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
      if(calcExpression === "0" && val !== ".") calcExpression = "";
      calcExpression += val;
    }

    activeMoneyInput.value = calcExpression;
  });
});
