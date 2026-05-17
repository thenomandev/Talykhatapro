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

/* INITIAL LOAD */
window.addEventListener("DOMContentLoaded", async () => {
  await loadDashboard();

  // প্রতি ৩০ সেকেন্ড পর পর হোম স্ক্রিনের টাইম কাউন্টার লাইভ আপডেট করার জন্য ইন্টারভাল সেটআপ
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

  // সর্টিং: নাম অনুযায়ী সাজানো
  customers.sort((a, b) => a.name.localeCompare(b.name, "bn"));

  const q = searchInput ? searchInput.value.toLowerCase() : "";
  const filtered = customers.filter(c => c.name.toLowerCase().includes(q));
  
  renderCustomerList(filtered);
  updateSummary();
}

/* ১ নম্বর স্ক্রিনশটের মতো লিস্ট রেন্ডার এবং লাইভ টাইম কাউন্ট লজিক */
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
    
    // ১ নম্বর স্ক্রিনশটের মতো কারেন্সি সিম্বল (৳) ছাড়া শুধুমাত্র পিউর অ্যামাউন্ট দেখাবে
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

    // লাইভ শেষ ট্রানজেকশন বা কাস্টমার তৈরি করার সময় থেকে সেকেন্ড/মিনিট/ঘণ্টা/দিন কাউন্ট লজিক
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

    // প্রিমিয়াম লাইট কালার শেডের ব্যাকগ্রাউন্ড আইকন বণ্টন
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

/* ড্যাশবোর্ড সামারি কারেকশন (৳ সিম্বল ছাড়া একই লেআউট) */
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

/* নতুন হেল্পার ফাংশন: যা কারেন্সি সাইন ছাড়া ডেসিমালসহ ডাটা রিটার্ন করবে */
function moneyWithoutSymbol(v) {
  let parsed = parseFloat(v);
  if (isNaN(parsed) || parsed === 0) return "০.০০";
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* CUSTOMER INTERACTION & SAVE EVENT */
if (openCustomerModal) {
  openCustomerModal.onclick = () => {
    customerFormTitle.textContent = "নতুন গ্রাহক যোগ করুন";
    customerName.value = "";
    customerPhone.value = "";
    customerOpening.value = "";
    if (openingBalContainer) openingBalContainer.style.display = "block";
    switchScreen(customerFormScreen);
  };
}

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

/* LIVE SEARCH */
if (searchInput) {
  searchInput.oninput = () => {
    const q = searchInput.value.toLowerCase();
    const filtered = customers.filter(c => c.name.toLowerCase().includes(q));
    renderCustomerList(filtered);
  };
}

/* UTILS & MATH COMPUTATION */
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

function formatBanglaNumber(str) {
  const englishToBangla = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return str.toString().replace(/[0-9]/g, w => englishToBangla[w] || w);
}

// অন্যান্য লেজার ও রিপোর্ট ফাংশনালিটি পরিচালনার জন্য পূর্বের ব্যাকআপ মেথড (সুরক্ষিত রাখা হয়েছে)
function openLedger(cust) {
  currentCustomer = cust;
  if (ledgerName) ledgerName.textContent = cust.name;
  if (ledgerAvatar) ledgerAvatar.textContent = cust.name.charAt(0).toUpperCase();
  
  let bal = cust.computedBalance || 0;
  if (ledgerBalance) {
    if (bal > 0) {
      ledgerBalance.textContent = "৳ " + formatBanglaNumber(moneyWithoutSymbol(bal));
      if (ledgerBalanceLabel) ledgerBalanceLabel.textContent = "পাবো";
    } else if (bal < 0) {
      ledgerBalance.textContent = "৳ " + formatBanglaNumber(moneyWithoutSymbol(Math.abs(bal)));
      if (ledgerBalanceLabel) ledgerBalanceLabel.textContent = "দেবো";
    } else {
      ledgerBalance.textContent = "৳ ০.০০";
      if (ledgerBalanceLabel) ledgerBalanceLabel.textContent = "পরিশোধ";
    }
  }
  switchScreen(ledgerScreen);
}

if (backToHome) {
  backToHome.onclick = async () => {
    currentCustomer = null;
    await loadDashboard();
    switchScreen(homeScreen);
  };
}
