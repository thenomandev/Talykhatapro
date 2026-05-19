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

const customerAvatarInput = document.getElementById("customerAvatarInput");
const avatarUploadBtn = document.getElementById("avatarUploadBtn");
const avatarPreviewImg = document.getElementById("avatarPreviewImg");
const avatarDefaultIcon = document.getElementById("avatarDefaultIcon");

let selectedAvatarBase64 = "";

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

const btnImportContact = document.getElementById("btnImportContact");

let activeMoneyInput = null;
let calcExpression = "";

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
  initContactPicker();
  
  if (avatarUploadBtn && customerAvatarInput) {
    avatarUploadBtn.addEventListener("click", () => {
      customerAvatarInput.click();
    });
    customerAvatarInput.addEventListener("change", handleAvatarSelect);
  }

  history.replaceState({ screen: "home" }, "");
  history.pushState({ screen: "ready" }, "");
});

window.addEventListener("popstate", (e) => {
  if (e.state && e.state.screen === "home") {
    if (inlineCalculator) inlineCalculator.classList.remove("show");
    switchScreen(homeScreen);
    history.pushState({ screen: "ready" }, "");
  }
});

/* OPTIMIZED FAST DASHBOARD LOAD */
async function loadDashboard() {
  customers = await getCustomers();
  
  // High-performance loading using Promise.all
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
    customerList.innerHTML = `
      <div style="text-align:center; padding:40px; color:#777;">
        কোনো গ্রাহক পাওয়া যায়নি
      </div>`;
    return;
  }

  list.sort((a, b) => 
    ((b.lastActivityAt || b.createdAt || 0) - (a.lastActivityAt || a.createdAt || 0))
  );

  list.forEach(cust => {
    const div = document.createElement("div");
    div.className = "customer-item";

    const bal = cust.computedBalance || 0;
    const absBal = Math.abs(bal);
    const amountClass = bal < 0 ? "green-amount" : bal > 0 ? "red-amount" : "zero-amount";

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

    let avatarPart = "";
    if (cust.avatarBase64) {
      avatarPart = `<img src="${cust.avatarBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    } else {
      avatarPart = cust.name.trim().length >= 2 
        ? cust.name.trim().substring(0, 2).toUpperCase() 
        : cust.name.trim().charAt(0).toUpperCase();
    }

    div.innerHTML = `
      <div class="cust-left">
        <div class="avatar" style="background:${cust.avatarColor || '#d9e2f3'}; overflow:hidden;">
          ${avatarPart}
        </div>
        <div>
          <div class="cust-name">${cust.name}</div>
          <div class="cust-time">${timeText}</div>
        </div>
      </div>
      <div class="cust-right">
        <span class="cust-amount ${amountClass}">৳ ${money(absBal)}</span>
        <i class="fa-solid fa-chevron-right" style="color:#ccc; font-size:12px;"></i>
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

/* LEDGER SCREEN WINDOW */
async function openLedger(customer) {
  currentCustomer = customer;
  switchScreen(ledgerScreen);
  history.pushState({ screen: "ledger" }, "");

  ledgerName.textContent = customer.name;

  if (customer.avatarBase64) {
    ledgerAvatar.innerHTML = `<img src="${customer.avatarBase64}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
    ledgerAvatar.style.background = "none";
  } else {
    ledgerAvatar.textContent = customer.name.trim().length >= 2 
      ? customer.name.trim().substring(0, 2).toUpperCase() 
      : customer.name.trim().charAt(0).toUpperCase();
    ledgerAvatar.style.background = customer.avatarColor || "#0b61a4";
  }

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

  const transactionList = document.getElementById("transactionList");
  if (transactionList) {
    transactionList.innerHTML = "";

    if (customer.openingBalance && customer.openingBalance !== 0) {
      const opDiv = document.createElement("div");
      opDiv.className = "transaction-item op-bal-item";
      const opLabel = customer.openingBalance > 0 ? "পাবো হিসেবে শুরু" : "দেবো হিসেবে শুরু";
      opDiv.innerHTML = `
        <div class="txn-note">opening balance (${opLabel})</div>
        <div class="txn-amount ${customer.openingBalance > 0 ? 'give' : 'receive'}">
          ৳ ${money(Math.abs(customer.openingBalance))}
        </div>
      `;
      transactionList.appendChild(opDiv);
    }

    txns.forEach(txn => {
      const div = document.createElement("div");
      div.className = "transaction-item";

      const isGive = txn.give > 0;
      const amount = isGive ? txn.give : txn.receive;
      const cls = isGive ? "give" : "receive";
      const label = isGive ? "দিলাম" : "পেলাম";

      const tDate = new Date(txn.createdAt);
      const timeStr = formatTimeBangla(tDate);
      const dateStr = formatDateBangla(tDate);

      div.innerHTML = `
        <div class="txn-meta-left">
          <div class="txn-datetime">${dateStr} • ${timeStr}</div>
          <div class="txn-note">${txn.note || (isGive ? "টাকা দিলাম" : "টাকা পেলাম")}</div>
        </div>
        <div class="txn-amount ${cls}">
          <div class="txn-label-sub">${label}</div>
          ৳ ${money(amount)}
        </div>
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
  updateSaveBtnState();
}

/* LIVE UI VALIDATION FOR ADD CUSTOMER FORM (FIXED VARIABLE NAMES) */
function initFormValidation() {
  const wrapperName = document.getElementById("nameWrapperCtx");
  const txtErrorName = document.getElementById("nameErrorTxtCtx");

  const pillCustomer = document.getElementById("pillCustomer");
  const pillSupplier = document.getElementById("pillSupplier");

  if (pillCustomer && pillSupplier) {
    const toggles = [pillCustomer, pillSupplier];
    toggles.forEach(pill => {
      pill.addEventListener("click", function () {
        toggles.forEach(p => p.classList.remove("active"));
        this.classList.add("active");
        const internalRadio = this.querySelector("input[type='radio']");
        if (internalRadio) internalRadio.checked = true;
      });
    });
  }

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

    const isPhoneValid = valPhone.length >= 11;

    // Fixed elements: Using correct variable name registered globally
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

/* PHONEBOOK / CONTACT PICKER ENGINE (FIXED & LOGGED) */
function initContactPicker() {
  if (!btnImportContact) return;

  btnImportContact.addEventListener("click", async () => {
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
            let cleanPhone = contact.tel[0].replace(/[^0-9+]/g, "");
            if (cleanPhone.startsWith("+88")) {
              cleanPhone = cleanPhone.replace("+88", "");
            }
            customerPhone.value = cleanPhone;
          }

          // Triggering input validation instantly
          customerName.dispatchEvent(new Event("input"));
          customerPhone.dispatchEvent(new Event("input"));
        }
      } catch (err) {
        console.log("Contact Picker Canceled/Error: ", err);
      }
    } else {
      alert("আপনার ব্রাউজার বা ডিভাইসে সরাসরি ফোনবুক খোলার অনুমতি নেই। অনুগ্রহ করে টাইপ করুন।");
    }
  });
}

/* AVATAR FILE HANDLER */
function handleAvatarSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    selectedAvatarBase64 = event.target.result;
    if (avatarPreviewImg) {
      avatarPreviewImg.src = selectedAvatarBase64;
      avatarPreviewImg.style.display = "block";
    }
    if (avatarDefaultIcon) {
      avatarDefaultIcon.style.display = "none";
    }
  };
  reader.readAsDataURL(file);
}

function resetAvatarUi() {
  selectedAvatarBase64 = "";
  if (customerAvatarInput) customerAvatarInput.value = "";
  if (avatarPreviewImg) {
    avatarPreviewImg.src = "";
    avatarPreviewImg.style.display = "none";
  }
  if (avatarDefaultIcon) {
    avatarDefaultIcon.style.display = "block";
  }
}

/* SAVE CUSTOMER SYSTEM */
if (saveCustomerBtn) {
  saveCustomerBtn.onclick = async () => {
    const nameVal = customerName.value.trim();
    const phoneVal = customerPhone.value.trim();

    let openingVal = parseFloat(customerOpening.value) || 0;
    const opTypeRadio = document.querySelector("input[name='openingType']:checked");
    if (opTypeRadio && opTypeRadio.value === "give") {
      openingVal = openingVal * 1; 
    } else if (opTypeRadio && opTypeRadio.value === "receive") {
      openingVal = openingVal * -1;
    }

    if (nameVal.length < 3 || phoneVal.length < 11) return;

    if (currentCustomer && currentCustomer.id) {
      currentCustomer.name = nameVal;
      currentCustomer.phone = phoneVal;
      currentCustomer.openingBalance = openingVal;
      if (selectedAvatarBase64) {
        currentCustomer.avatarBase64 = selectedAvatarBase64;
      }
      currentCustomer.lastActivityAt = Date.now();
      await updateCustomer(currentCustomer);
    } else {
      const colors = ["#d9e2f3", "#d9f5d7", "#f7efc2", "#dfe7f7", "#f7dce0"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const newCust = {
        id: "cust_" + Date.now(),
        name: nameVal,
        phone: phoneVal,
        openingBalance: openingVal,
        avatarColor: randomColor,
        avatarBase64: selectedAvatarBase64,
        createdAt: Date.now(),
        lastActivityAt: Date.now()
      };
      await addCustomer(newCust);
    }

    await loadDashboard();
    if (inlineCalculator) inlineCalculator.classList.remove("show");
    switchScreen(homeScreen);
  };
}

/* SAVE TRANSACTION SYSTEM */
if (saveTxnBtn) {
  saveTxnBtn.onclick = async () => {
    if (!currentCustomer) return;

    const giveVal = parseFloat(txnGive.value) || 0;
    const receiveVal = parseFloat(txnReceive.value) || 0;
    const noteVal = txnNote.value.trim();

    if (giveVal === 0 && receiveVal === 0) {
      alert("অনুগ্রহ করে একটি সঠিক অংক বসান!");
      return;
    }

    const newTxn = {
      id: "txn_" + Date.now(),
      customerId: currentCustomer.id,
      give: giveVal,
      receive: receiveVal,
      note: noteVal,
      createdAt: selectedTxnDate.getTime()
    };

    await addTransaction(newTxn);

    currentCustomer.lastActivityAt = Date.now();
    await updateCustomer(currentCustomer);

    await loadDashboard();

    const updated = customers.find(c => c.id === currentCustomer.id);
    if (updated) openLedger(updated);

    if (inlineCalculator) inlineCalculator.classList.remove("show");
  };
}

/* NAVIGATION TRIGGERS */
if (openCustomerModal) {
  openCustomerModal.onclick = () => {
    currentCustomer = null;
    resetAvatarUi();

    if (customerFormTitle) customerFormTitle.textContent = "নতুন কাস্টমার/সাপ্লায়ার";
    if (customerName) customerName.value = "";
    if (customerPhone) customerPhone.value = "";
    if (customerOpening) customerOpening.value = "";

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
    history.pushState({ screen: "form" }, "");
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

if (optEdit) {
  optEdit.onclick = () => {
    if (!currentCustomer) return;
    resetAvatarUi();

    if (customerFormTitle) customerFormTitle.textContent = "কাস্টমার প্রোফাইল এডিট";
    if (customerName) customerName.value = currentCustomer.name;
    if (customerPhone) customerPhone.value = currentCustomer.phone;

    if (currentCustomer.openingBalance) {
      if (customerOpening) customerOpening.value = Math.abs(currentCustomer.openingBalance);
      if (currentCustomer.openingBalance > 0) {
        document.getElementById("radioGive").checked = true;
        document.getElementById("pillCustomer").classList.add("active");
        document.getElementById("pillSupplier").classList.remove("active");
      } else {
        document.getElementById("radioReceive").checked = true;
        document.getElementById("pillSupplier").classList.add("active");
        document.getElementById("pillCustomer").classList.remove("active");
      }
    } else {
      if (customerOpening) customerOpening.value = "";
      document.getElementById("radioGive").checked = true;
      document.getElementById("pillCustomer").classList.add("active");
      document.getElementById("pillSupplier").classList.remove("active");
    }

    if (currentCustomer.avatarBase64) {
      selectedAvatarBase64 = currentCustomer.avatarBase64;
      if (avatarPreviewImg) {
        avatarPreviewImg.src = selectedAvatarBase64;
        avatarPreviewImg.style.display = "block";
      }
      if (avatarDefaultIcon) avatarDefaultIcon.style.display = "none";
    }

    customerName.dispatchEvent(new Event("input"));
    switchScreen(customerFormScreen);
  };
}

/* SEARCH ENGINE */
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = customers.filter(c => 
      c.name.toLowerCase().includes(term) || c.phone.includes(term)
    );
    renderCustomerList(filtered);
  });
}

function updateTxnDateButton() {
  if (txnDateBtn) {
    txnDateBtn.textContent = "📅 আজ";
  }
}

function updateSaveBtnState() {
  if (!saveTxnBtn) return;
  const g = parseFloat(txnGive.value) || 0;
  const r = parseFloat(txnReceive.value) || 0;

  if (g > 0 || r > 0) {
    saveTxnBtn.removeAttribute("disabled");
    saveTxnBtn.style.background = "#b51e23";
    saveTxnBtn.style.color = "#ffffff";
    saveTxnBtn.style.opacity = "1";
    saveTxnBtn.style.cursor = "pointer";
  } else {
    saveTxnBtn.setAttribute("disabled", "true");
    saveTxnBtn.style.background = "#f5f5f5";
    saveTxnBtn.style.color = "#bbbbbb";
    saveTxnBtn.style.opacity = "0.7";
    saveTxnBtn.style.cursor = "not-allowed";
  }
}

/* TRANSACTION INPUT & KEYPAD ENGINE */
moneyInputs.forEach(input => {
  const activateInput = (e) => {
    e.preventDefault();

    activeMoneyInput = input;
    calcExpression = input.value || "";

    moneyInputs.forEach(i => i.classList.remove("active-focus"));
    input.classList.add("active-focus");

    if (inlineCalculator) {
      inlineCalculator.classList.add("show");
    }
    
    // Smooth scroll integration safely
    setTimeout(() => {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
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

        if (!/^[0-9+\\-*/%.() ]+$/.test(safeExpr)) {
          throw new Error("Invalid");
        }

        calcExpression = String(
          Function("return (" + safeExpr.replace(/%/g, "/100") + ")")()
        );

        activeMoneyInput.value = calcExpression;
        activeMoneyInput.focus();
        activeMoneyInput.setSelectionRange(activeMoneyInput.value.length, activeMoneyInput.value.length);
        updateSaveBtnState();
      } catch {
        calcExpression = "";
        activeMoneyInput.value = "";
      }
    } else {
      calcExpression += val;
    }

    activeMoneyInput.value = calcExpression;
    activeMoneyInput.focus();
    activeMoneyInput.setSelectionRange(activeMoneyInput.value.length, activeMoneyInput.value.length);
    updateSaveBtnState();
  });
});
