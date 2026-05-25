let homeLiveInterval = null;

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

    const secs = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

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