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
  history.pushState({screen:"ledger"}, "");

  ledgerName.textContent = customer.name;

  if(customer.avatarImage){
    ledgerAvatar.innerHTML =
      `<img src="${customer.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;

    ledgerAvatar.style.background = "transparent";
  } else {
    ledgerAvatar.textContent =
      customer.name.trim().length >= 2
        ? customer.name.trim().substring(0,2).toUpperCase()
        : customer.name.trim().charAt(0).toUpperCase();

    ledgerAvatar.style.background =
      customer.avatarColor || "#0b61a4";
  }

  if (threeDotMenu) {
    threeDotMenu.classList.remove("active");
  }

  if (reportViewContainer) {
    reportViewContainer.style.display = "none";
  }

  const txns = await getTransactions(customer.id);

  startLiveTimer(customer, txns);

  const bal = calcBalance(customer, txns);

  currentCustomer.computedBalance = bal;

  if (bal >= 0) {
    if (ledgerBalanceLabel) {
      ledgerBalanceLabel.textContent = "পাবো";
    }

    ledgerBalance.innerHTML = `৳ ${money(bal)}`;
    ledgerTopBalance.innerHTML = `৳ ${money(bal)}`;
    ledgerBalance.style.color = "#b51e23";
  } else {
    if (ledgerBalanceLabel) {
      ledgerBalanceLabel.textContent = "দেবো";
    }

    ledgerBalance.innerHTML = `৳ ${money(Math.abs(bal))}`;
    ledgerTopBalance.innerHTML = `৳ ${money(Math.abs(bal))}`;
    ledgerBalance.style.color = "#118a4d";
  }

  const transactionList =
    document.getElementById("transactionList");

  if (transactionList) {
    transactionList.innerHTML = "";

    txns.forEach(txn => {
      const div = document.createElement("div");

      div.className = "transaction-item";

      const amount =
        txn.give > 0 ? txn.give : txn.receive;

      const cls =
        txn.give > 0 ? "give" : "receive";

      const label =
        txn.give > 0 ? "দিলাম" : "পেলাম";

      div.innerHTML = `
        <div class="txn-note">${txn.note || "লেনদেন"}</div>
        <div class="txn-amount ${cls}">
          ${label}: ৳ ${money(amount)}
        </div>
      `;

      div.oncontextmenu = async (e) => {
        e.preventDefault();

        if (confirm("এই লেনদেনটি ডিলিট করতে চান?")) {
          await deleteTransaction(txn.id);
          await loadDashboard();

          const updated = customers.find(
            c => c.id === currentCustomer.id
          );

          if (updated) {
            openLedger(updated);
          }
        }
      };

      transactionList.appendChild(div);
    });
  }

  if (reportTxnList) {
    reportTxnList.innerHTML = "";

    let totalGaveSum = 0;
    let totalGotSum = 0;

    if (customer.openingBalance && customer.openingBalance !== 0) {
      const row = document.createElement("div");

      row.className = "report-row";

      const opDate =
        new Date(customer.createdAt || Date.now());

      let gaveVal =
        customer.openingBalance > 0
          ? customer.openingBalance
          : 0;

      let gotVal =
        customer.openingBalance < 0
          ? Math.abs(customer.openingBalance)
          : 0;

      totalGaveSum += gaveVal;
      totalGotSum += gotVal;

      row.innerHTML = `
        <div class="rep-details">
          <div class="rep-date">${formatDateBangla(opDate)}</div>
          <div class="rep-time">${formatTimeBangla(opDate)}</div>
          <div class="rep-note">শুরুর ব্যালেন্স</div>
        </div>
        <div class="rep-gave">
          ${gaveVal > 0 ? money(gaveVal) : ""}
        </div>
        <div class="rep-got">
          ${gotVal > 0 ? money(gotVal) : ""}
        </div>
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
        <div class="rep-gave">
          ${txn.give > 0 ? money(txn.give) : ""}
        </div>
        <div class="rep-got">
          ${txn.receive > 0 ? money(txn.receive) : ""}
        </div>
      `;

      reportTxnList.appendChild(row);
    });

    if (reportTotalGave) {
      reportTotalGave.textContent = money(totalGaveSum);
    }

    if (reportTotalGot) {
      reportTotalGot.textContent = money(totalGotSum);
    }
  }
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

if (optTagada) {
  optTagada.onclick = () => {
    alert(`"${currentCustomer.name}" এর মোবাইলে তাগাদা মেসেজ পাঠানো হয়েছে!`);
  };
}

if (optReport) {
  optReport.onclick = () => {
    if (reportViewContainer) {
      reportViewContainer.style.display = "flex";
    }
  };
}

if (closeReportBtn) {
  closeReportBtn.onclick = () => {
    if (reportViewContainer) {
      reportViewContainer.style.display = "none";
    }
  };
}

if (optDelete) {
  optDelete.onclick = async () => {
    if (
      confirm(
        `আপনি কি নিশ্চিতভাবে "${currentCustomer.name}" কে সম্পূর্ণ ডিলিট করতে চান?`
      )
    ) {
      if (liveInterval) {
        clearInterval(liveInterval);
      }

      await deleteCustomer(currentCustomer.id);

      currentCustomer = null;

      await loadDashboard();

      switchScreen(homeScreen);
    }
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

    document
      .getElementById("txnGiveBox")
      ?.classList.remove("active", "has-value");

    document
      .getElementById("txnReceiveBox")
      ?.classList.remove("active", "has-value");

    document
      .getElementById("txnNoteBox")
      ?.classList.remove("active", "has-value");

    const ledgerFooter =
      document.querySelector(".ledger-save-footer");

    if (ledgerFooter) {
      ledgerFooter.style.transform = "translateX(-50%)";
    }

    updateSaveBtnState();

    selectedTxnDate = new Date();
    updateTxnDateButton();

    await loadDashboard();

    const updatedCust = customers.find(
      c => c.id === currentCustomer.id
    );

    if (updatedCust) {
      await openLedger(updatedCust);
    }
  };
}

