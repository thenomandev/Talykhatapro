function buildCustomerReport(customer, txns) {
  if (!reportTxnList) return;

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