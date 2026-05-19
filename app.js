let customers = [];
let currentCustomer = null;
let selectedTxnDate = new Date();
let liveInterval = null;
let selectedAvatarBase64 = "";
let activeMoneyInput = null;
let calcExpression = "";

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

const customerAvatarInput = document.getElementById("customerAvatarInput");
const avatarUploadBtn = document.getElementById("avatarUploadBtn");
const avatarPreviewImg = document.getElementById("avatarPreviewImg");
const avatarDefaultIcon = document.getElementById("avatarDefaultIcon");

const backToHome = document.getElementById("backToHome");
const ledgerAvatar = document.getElementById("ledgerAvatar");
const ledgerName = document.getElementById("ledgerName");
const ledgerBalance = document.getElementById("ledgerBalance");
const ledgerBalanceLabel = document.getElementById("ledgerBalanceLabel");
const ledgerTopBalance = document.getElementById("ledgerTopBalance");

const deleteCustomerBtn = document.getElementById("deleteCustomerBtn");
const threeDotMenu = document.getElementById("threeDotMenu");
const optDelete = document.getElementById("optDelete");
const optEdit = document.getElementById("optEdit");

const txnGive = document.getElementById("txnGive");
const txnReceive = document.getElementById("txnReceive");
const txnNote = document.getElementById("txnNote");
const txnDateBtn = document.getElementById("txnDateBtn");
const saveTxnBtn = document.getElementById("saveTxnBtn");

const moneyInputs = document.querySelectorAll(".money-input");
const calcKeys = document.querySelectorAll(".calc-key");
const inlineCalculator = document.getElementById("inlineCalculator");

const liveTimeCounter = document.querySelector(".status-right");
const reportViewContainer = document.getElementById("reportViewContainer");

/* INIT */
window.addEventListener("DOMContentLoaded", async () => {
  await loadDashboard();
  initFormValidation();
  updateTxnDateButton();
  initAvatarSystem();

  history.replaceState({ screen: "home" }, "");
  history.pushState({ screen: "ready" }, "");
});

async function loadDashboard() {
  customers = await getCustomers();

  await Promise.all(
    customers.map(async (cust) => {
      const txns = await getTransactions(cust.id);
      cust.computedBalance = calcBalance(cust, txns);
    })
  );

  renderCustomerList(customers);
  updateSummary();
}

function renderCustomerList(list) {
  customerList.innerHTML = "";
  customerCount.textContent =
    `${formatBanglaNumber(list.length)} / সাপ্লায়ার ০`;

  if (list.length === 0) {
    customerList.innerHTML =
      `<div style="text-align:center;padding:40px;color:#777;">
        কোনো গ্রাহক পাওয়া যায়নি
      </div>`;
    return;
  }

  list.sort(
    (a, b) =>
      ((b.lastActivityAt || b.createdAt || 0) -
       (a.lastActivityAt || a.createdAt || 0))
  );

  list.forEach((cust) => {
    const div = document.createElement("div");
    div.className = "customer-item";

    const bal = cust.computedBalance || 0;
    const absBal = Math.abs(bal);

    const amountClass =
      bal < 0
        ? "green-amount"
        : bal > 0
        ? "red-amount"
        : "zero-amount";

    let avatarHtml = "";

    if (cust.avatarBase64) {
      avatarHtml =
        `<img src="${cust.avatarBase64}"
          style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      avatarHtml =
        cust.name.trim().length >= 2
          ? cust.name.trim().substring(0, 2).toUpperCase()
          : cust.name.trim().charAt(0).toUpperCase();
    }

    const refTime =
      cust.lastActivityAt || cust.createdAt || Date.now();

    const diffMs = Date.now() - refTime;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    let timeText = "এইমাত্র";

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
        <div class="avatar"
             style="background:${cust.avatarColor || "#d9e2f3"};">
          ${avatarHtml}
        </div>

        <div>
          <div class="cust-name">${cust.name}</div>
          <div class="cust-time">${timeText}</div>
        </div>
      </div>

      <div class="cust-right">
        <span class="cust-amount ${amountClass}">
          ৳ ${money(absBal)}
        </span>
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

  customers.forEach((c) => {
    const b = c.computedBalance || 0;

    if (b > 0) rec += b;
    if (b < 0) giv += Math.abs(b);
  });

  totalReceive.textContent =
    formatBanglaNumber(Math.round(rec));

  totalGive.textContent =
    formatBanglaNumber(Math.round(giv));
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
  liveInterval = setInterval(updateTime, 30000);
}

async function openLedger(customer) {
  currentCustomer = customer;

  switchScreen(ledgerScreen);
  history.pushState({ screen: "ledger" }, "");

  ledgerName.textContent = customer.name;

  if (customer.avatarBase64) {
    ledgerAvatar.innerHTML =
      `<img src="${customer.avatarBase64}"
       style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;

    ledgerAvatar.style.background = "none";
  } else {
    ledgerAvatar.innerHTML =
      customer.name.trim().length >= 2
        ? customer.name.trim().substring(0, 2).toUpperCase()
        : customer.name.trim().charAt(0).toUpperCase();

    ledgerAvatar.style.background =
      customer.avatarColor || "#0b61a4";
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
    ledgerBalanceLabel.textContent = "পাবো";
    ledgerBalance.innerHTML = `৳ ${money(bal)}`;
    ledgerTopBalance.innerHTML = `৳ ${money(bal)}`;
    ledgerBalance.style.color = "#b51e23";
  } else {
    ledgerBalanceLabel.textContent = "দেবো";
    ledgerBalance.innerHTML = `৳ ${money(Math.abs(bal))}`;
    ledgerTopBalance.innerHTML = `৳ ${money(Math.abs(bal))}`;
    ledgerBalance.style.color = "#118a4d";
  }

  const transactionList =
    document.getElementById("transactionList");

  transactionList.innerHTML = "";

  txns.forEach((txn) => {
    const div = document.createElement("div");

    div.className = "transaction-item";

    const isGive = txn.give > 0;
    const amount = isGive ? txn.give : txn.receive;
    const cls = isGive ? "give" : "receive";
    const label = isGive ? "দিলাম" : "পেলাম";

    div.innerHTML = `
      <div class="txn-note">
        ${txn.note || "লেনদেন"}
      </div>

      <div class="txn-amount ${cls}">
        ${label}: ৳ ${money(amount)}
      </div>
    `;

    div.oncontextmenu = async (e) => {
      e.preventDefault();

      if (confirm("এই লেনদেনটি ডিলিট করতে চান?")) {
        await deleteTransaction(txn.id);
        await loadDashboard();

        const updated =
          customers.find((c) => c.id === currentCustomer.id);

        if (updated) openLedger(updated);
      }
    };

    transactionList.appendChild(div);
  });
}

function initFormValidation() {
  const wrapperName = document.getElementById("nameWrapperCtx");
  const txtErrorName = document.getElementById("nameErrorTxtCtx");

  function runValidation() {
    const nameVal = customerName.value.trim();
    const phoneVal = customerPhone.value.trim();

    const validName = nameVal.length >= 3;
    const validPhone = phoneVal.length >= 11;

    if (nameVal.length > 0 && !validName) {
      if (wrapperName) wrapperName.classList.add("wrapper-error-state");
      if (txtErrorName) txtErrorName.style.display = "block";
    } else {
      if (wrapperName) wrapperName.classList.remove("wrapper-error-state");
      if (txtErrorName) txtErrorName.style.display = "none";
    }

    if (validName && validPhone) {
      if (openingBalContainer) {
        openingBalContainer.classList.add("reveal-section");
      }

      saveCustomerBtn.removeAttribute("disabled");
      saveCustomerBtn.classList.add("active-state-btn");
    } else {
      if (openingBalContainer) {
        openingBalContainer.classList.remove("reveal-section");
      }

      saveCustomerBtn.setAttribute("disabled", "true");
      saveCustomerBtn.classList.remove("active-state-btn");
    }
  }

  customerName.addEventListener("input", runValidation);
  customerPhone.addEventListener("input", runValidation);
}

function initAvatarSystem() {
  if (!avatarUploadBtn || !customerAvatarInput) return;

  avatarUploadBtn.onclick = () => {
    customerAvatarInput.click();
  };

  customerAvatarInput.onchange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      selectedAvatarBase64 = ev.target.result;

      avatarPreviewImg.src = selectedAvatarBase64;
      avatarPreviewImg.style.display = "block";

      avatarDefaultIcon.style.display = "none";
    };

    reader.readAsDataURL(file);
  };
}

function resetAvatar() {
  selectedAvatarBase64 = "";

  if (customerAvatarInput) {
    customerAvatarInput.value = "";
  }

  if (avatarPreviewImg) {
    avatarPreviewImg.src = "";
    avatarPreviewImg.style.display = "none";
  }

  if (avatarDefaultIcon) {
    avatarDefaultIcon.style.display = "flex";
  }
}

if (saveCustomerBtn) {
  saveCustomerBtn.onclick = async () => {
    const nameVal = customerName.value.trim();
    const phoneVal = customerPhone.value.trim();
    const openingVal = parseFloat(customerOpening.value) || 0;

    if (nameVal.length < 3 || phoneVal.length < 11) return;

    const colors = [
      "#d9e2f3",
      "#d9f5d7",
      "#f7efc2",
      "#dfe7f7",
      "#f7dce0"
    ];

    const randomColor =
      colors[Math.floor(Math.random() * colors.length)];

    const newCust = {
      id: "cust_" + Date.now(),
      name: nameVal,
      phone: phoneVal,
      openingBalance: openingVal,
      avatarBase64: selectedAvatarBase64,
      avatarColor: randomColor,
      createdAt: Date.now(),
      lastActivityAt: Date.now()
    };

    await addCustomer(newCust);

    resetAvatar();

    await loadDashboard();

    switchScreen(homeScreen);
  };
}

if (saveTxnBtn) {
  saveTxnBtn.onclick = async () => {
    if (!currentCustomer) return;

    const giveVal = parseFloat(txnGive.value) || 0;
    const receiveVal = parseFloat(txnReceive.value) || 0;

    if (giveVal === 0 && receiveVal === 0) {
      alert("অনুগ্রহ করে অংক লিখুন");
      return;
    }

    const newTxn = {
      id: "txn_" + Date.now(),
      customerId: currentCustomer.id,
      give: giveVal,
      receive: receiveVal,
      note: txnNote.value.trim(),
      createdAt: Date.now()
    };

    await addTransaction(newTxn);

    currentCustomer.lastActivityAt = Date.now();
    await updateCustomer(currentCustomer);

    await loadDashboard();

    const updated =
      customers.find((c) => c.id === currentCustomer.id);

    if (updated) openLedger(updated);
  };
}


if (openCustomerModal) {
  openCustomerModal.onclick = () => {
    currentCustomer = null;

    resetAvatar();

    customerFormTitle.textContent = "নতুন কাস্টমার/সাপ্লায়ার";
    customerName.value = "";
    customerPhone.value = "";
    customerOpening.value = "";
    txnNote.value = "";

    const wrapperName = document.getElementById("nameWrapperCtx");
    const txtErrorName = document.getElementById("nameErrorTxtCtx");

    if (wrapperName) {
      wrapperName.classList.remove("wrapper-error-state");
    }

    if (txtErrorName) {
      txtErrorName.style.display = "none";
    }

    if (openingBalContainer) {
      openingBalContainer.classList.remove("reveal-section");
    }

    saveCustomerBtn.setAttribute("disabled", "true");
    saveCustomerBtn.classList.remove("active-state-btn");

    switchScreen(customerFormScreen);

    history.pushState({ screen: "form" }, "");
  };
}

if (backFromCustomerForm) {
  backFromCustomerForm.onclick = () => {
    if (inlineCalculator) {
      inlineCalculator.classList.remove("show");
    }

    switchScreen(homeScreen);
  };
}

if (backToHome) {
  backToHome.onclick = () => {
    if (liveInterval) {
      clearInterval(liveInterval);
    }

    if (inlineCalculator) {
      inlineCalculator.classList.remove("show");
    }

    switchScreen(homeScreen);
  };
}

if (deleteCustomerBtn) {
  deleteCustomerBtn.onclick = (e) => {
    e.stopPropagation();

    if (threeDotMenu) {
      threeDotMenu.classList.toggle("active");
    }
  };
}

document.addEventListener("click", () => {
  if (threeDotMenu) {
    threeDotMenu.classList.remove("active");
  }
});

if (optDelete) {
  optDelete.onclick = async () => {
    if (!currentCustomer) return;

    if (
      confirm(
        `আপনি কি নিশ্চিতভাবে "${currentCustomer.name}" কে ডিলিট করতে চান?`
      )
    ) {
      await deleteCustomer(currentCustomer.id);
      await loadDashboard();
      switchScreen(homeScreen);
    }
  };
}

if (optEdit) {
  optEdit.onclick = () => {
    if (!currentCustomer) return;

    customerFormTitle.textContent = "কাস্টমার এডিট";

    customerName.value = currentCustomer.name || "";
    customerPhone.value = currentCustomer.phone || "";
    customerOpening.value = currentCustomer.openingBalance || "";

    selectedAvatarBase64 = currentCustomer.avatarBase64 || "";

    if (selectedAvatarBase64) {
      avatarPreviewImg.src = selectedAvatarBase64;
      avatarPreviewImg.style.display = "block";
      avatarDefaultIcon.style.display = "none";
    } else {
      resetAvatar();
    }

    switchScreen(customerFormScreen);
  };
}

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();

    const filtered = customers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term)
    );

    renderCustomerList(filtered);
  });
}

function updateTxnDateButton() {
  if (txnDateBtn) {
    txnDateBtn.textContent = "📅 আজ";
  }
}

moneyInputs.forEach((input) => {
  input.addEventListener("pointerdown", (e) => {
    e.preventDefault();

    activeMoneyInput = input;
    calcExpression = input.value || "";

    moneyInputs.forEach((i) =>
      i.classList.remove("active-focus")
    );

    input.classList.add("active-focus");

    if (inlineCalculator) {
      inlineCalculator.classList.add("show");
    }
  });
});

calcKeys.forEach((key) => {
  key.addEventListener("click", () => {
    if (!activeMoneyInput) return;

    const val = key.dataset.key;

    if (val === "AC") {
      calcExpression = "";
    } else if (val === "BACK") {
      calcExpression = calcExpression.slice(0, -1);
    } else if (val === "=") {
      try {
        const safeExpr = calcExpression
          .replace(/×/g, "*")
          .replace(/÷/g, "/");

        calcExpression = String(
          Function(
            "return (" +
              safeExpr.replace(/%/g, "/100") +
            ")"
          )()
        );
      } catch {
        calcExpression = "";
      }
    } else {
      calcExpression += val;
    }

    activeMoneyInput.value = calcExpression;
  });
});

