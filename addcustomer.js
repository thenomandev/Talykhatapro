if (saveCustomerBtn) {
  saveCustomerBtn.onclick = async (e) => {
    if (e) e.preventDefault();

    const name = customerName.value.trim();
    const phone = customerPhone.value.trim();
    const opening = parseFloat(customerOpening.value) || 0;

    if (!name) {
      alert("অনুগ্রহ করে গ্রাহকের নাম লিখুন!");
      return;
    }

    if (isEditMode && currentCustomer) {
      editDraft.name = name;
      editDraft.phone = phone;
      editDraft.avatarImage = customerPremiumState.avatarImage || "";

      showEditConfirmScreen();
      return;
    } else {

      const avatarColors = ["#c8e6c9", "#f3e5ab", "#d9e2f3", "#f6d6dc"];

      const lastColor = customers.length
        ? customers[customers.length - 1].avatarColor
        : null;

      const availableColors = avatarColors.filter(
        color => color !== lastColor
      );

      const randomColor =
        availableColors[
          Math.floor(Math.random() * availableColors.length)
        ];

      const newCust = {
        id: Date.now().toString(),
        name: name,
        phone: phone,
        openingBalance: opening,
        createdAt: Date.now(),
        avatarColor: randomColor,
        userType: customerPremiumState.userType || "customer",
        avatarImage: customerPremiumState.avatarImage || "",
        attachedPhoto: customerPremiumState.attachedPhoto || "",
        selectedDate: customerPremiumState.selectedDate
          ? customerPremiumState.selectedDate.getTime()
          : Date.now()
      };

      await addCustomer(newCust);
      await loadDashboard();

      showCustomerSuccess(`${name} যোগ করা হয়েছে`);

      customerName.value = "";
      customerPhone.value = "";
      customerOpening.value = "";

      customerPremiumState.avatarImage = "";
      customerPremiumState.attachedPhoto = "";
      customerPremiumState.userType = "customer";
      customerPremiumState.selectedDate = new Date();

      document.getElementById("customerAvatarPreview").style.display = "none";
      document.getElementById("customerAvatarIcon").style.display = "block";

      const saved = customers.find(c => c.id === newCust.id);

      setTimeout(async ()=>{
        await openLedger(saved || newCust);
      }, 2100);
    }
  };
}

if (openCustomerModal) {
  openCustomerModal.onclick = () => {
    customerFormTitle.textContent = "নতুন কাস্টমার/সাপ্লায়ার";
    saveCustomerBtn.textContent = "নিশ্চিত";
    isEditMode = false;

    if(window.resetCustomerFormUI){
      resetCustomerFormUI();
    }

    switchScreen(customerFormScreen);
    history.pushState({screen:"form"}, "");
  };
}