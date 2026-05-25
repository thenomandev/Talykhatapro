function updateTxnDateButton() {
  if (txnDateBtn) {
    txnDateBtn.innerHTML = `
      <img src="assets/svg/calendar.svg" class="calendar-icon" alt="Calendar">
      ${selectedTxnDate.toLocaleDateString("bn-BD", {
        day:"numeric",
        month:"short"
      })}
    `;
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

  const footer = document.querySelector(".ledger-save-footer");
  if(footer){
    footer.style.transform = "translateX(-50%)";
  }
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