if (optEdit) {
  optEdit.onclick = () => {
    isEditMode = true;

    editDraft = {
      id: currentCustomer.id,
      userType: currentCustomer.userType || "customer",
      name: currentCustomer.name || "",
      phone: currentCustomer.phone || "",
      avatarImage: currentCustomer.avatarImage || ""
    };

    customerFormTitle.textContent =
      currentCustomer?.userType === "supplier"
        ? "সাপ্লায়ার এডিট"
        : "কাস্টমার এডিট";

    saveCustomerBtn.textContent = "পরবর্তী";
    saveCustomerBtn.classList.remove("active");

    customerName.value = currentCustomer.name || "";
    customerPhone.value = currentCustomer.phone || "";

    window.checkEditChanges = () => {
      if(!isEditMode || !editDraft) return;

      const changed =
        customerName.value.trim() !== (editDraft.name || "") ||
        customerPhone.value.trim() !== (editDraft.phone || "") ||
        (customerPremiumState.avatarImage || "") !== (editDraft.avatarImage || "");

      if(changed){
        saveCustomerBtn.classList.add("active");
      }else{
        saveCustomerBtn.classList.remove("active");
      }
    };

    customerName.oninput = window.checkEditChanges;
    customerPhone.oninput = window.checkEditChanges;

    customerOpening.value = currentCustomer.openingBalance || "";

    document.getElementById("customerNameBox").classList.add("has-value");
    document.getElementById("customerPhoneBox").classList.add("has-value");
    document.getElementById("openingBalContainer").classList.add("has-value");

    customerPremiumState.userType = currentCustomer.userType || "customer";
    customerPremiumState.avatarImage = currentCustomer.avatarImage || "";
    customerPremiumState.attachedPhoto = currentCustomer.attachedPhoto || "";

    const avatarPreviewEl = document.getElementById("customerAvatarPreview");
    const avatarIconEl = document.getElementById("customerAvatarIcon");

    if(currentCustomer.avatarImage){
      avatarPreviewEl.src = currentCustomer.avatarImage;
      avatarPreviewEl.style.display = "block";
      avatarIconEl.style.display = "none";
    }else{
      avatarPreviewEl.src = "";
      avatarPreviewEl.style.display = "none";
      avatarIconEl.src = "assets/svg/pen.svg";
      avatarIconEl.style.display = "block";
    }

    document.getElementById("customerTypeCustomer").classList.toggle(
      "active",
      customerPremiumState.userType === "customer"
    );

    document.getElementById("customerTypeSupplier").classList.toggle(
      "active",
      customerPremiumState.userType === "supplier"
    );

    if (openingBalContainer) openingBalContainer.style.display = "none";

    switchScreen(customerFormScreen);
    history.pushState({screen:"form"}, "");
  };
}

function showEditConfirmScreen(){
  const screen = document.getElementById("editConfirmScreen");
  const title = document.getElementById("editConfirmTitle");
  const avatar = document.getElementById("editConfirmAvatar");
  const defaultAvatar = document.getElementById("editConfirmDefaultAvatar");
  const nameEl = document.getElementById("editConfirmName");
  const phoneEl = document.getElementById("editConfirmPhone");

  title.textContent =
    editDraft.userType === "supplier"
      ? "সাপ্লায়ার এডিট"
      : "কাস্টমার এডিট";

  nameEl.textContent = editDraft.name || "";
  phoneEl.textContent = editDraft.phone || "";

  if(editDraft.avatarImage){
    avatar.src = editDraft.avatarImage;
    avatar.style.display = "block";
    defaultAvatar.style.display = "none";
  }else{
    avatar.src = "";
    avatar.style.display = "none";
    defaultAvatar.style.display = "block";
  }

  screen.classList.add("show");
}

document.getElementById("backFromEditConfirm").onclick = ()=>{
  document.getElementById("editConfirmScreen").classList.remove("show");
};

document.getElementById("confirmEditBtn").onclick = async ()=>{
  if(!currentCustomer || !editDraft) return;

  currentCustomer.name = editDraft.name;
  currentCustomer.phone = editDraft.phone;
  currentCustomer.avatarImage = editDraft.avatarImage || "";
  currentCustomer.userType = editDraft.userType || "customer";

  await updateCustomer(currentCustomer);

  document.getElementById("editConfirmScreen").classList.remove("show");

  showCustomerSuccess(
    currentCustomer.userType === "supplier"
      ? "সাপ্লায়ারের তথ্য আপডেট করা হয়েছে।"
      : "কাস্টমারের তথ্য আপডেট করা হয়েছে।"
  );

  await loadDashboard();

  const updated = customers.find(c => c.id === currentCustomer.id);

  setTimeout(async ()=>{
    await openLedger(updated || currentCustomer);
  }, 2100);
};