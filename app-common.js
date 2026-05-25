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

    if(customerFormTitle.textContent === "???? ????????/?????????"){
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

    txnGive.value = "";
txnReceive.value = "";
txnNote.value = "";

updateSaveBtnState();
hideCalculator();

await loadDashboard();
switchScreen(homeScreen);

return true;
  }

  return false;
}

