function createCustomerUIState(){
  return {
    userType: "customer",
    avatarImage: "",
    attachedPhoto: "",
    selectedDate: new Date()
  };
}

function initPremiumCustomerUI(){
  const customerPremiumState =
  window.__customerUIState || (window.__customerUIState = createCustomerUIState());

  const nameInput = document.getElementById("customerName");
  const phoneInput = document.getElementById("customerPhone");
  const openingInput = document.getElementById("customerOpening");

  const nameBox = document.getElementById("customerNameBox");
  const phoneBox = document.getElementById("customerPhoneBox");
  const openingBox = document.getElementById("openingBalContainer");

  const saveBtn = document.getElementById("saveCustomerBtn");

  const customerBtn = document.getElementById("customerTypeCustomer");
  const supplierBtn = document.getElementById("customerTypeSupplier");

  const avatarPreview = document.getElementById("customerAvatarPreview");
  const avatarIcon = document.getElementById("customerAvatarIcon");

  const cameraInput = document.getElementById("customerCameraInput");
  const galleryInput = document.getElementById("customerGalleryInput");

  const attachPhotoInput = document.getElementById("customerAttachPhotoInput");

  const avatarPickerBackdrop = document.getElementById("avatarPickerBackdrop");
  const avatarPickerSheet = document.getElementById("avatarPickerSheet");
const deleteAvatarBtn = document.getElementById("deleteAvatarBtn");

  const customerDateBtn = document.getElementById("customerDateBtn");
  const customerDatePicker = document.getElementById("customerDatePicker");
  const customerDateText = document.getElementById("customerDateText");
const customerAttachBtn = document.getElementById("customerAttachPhotoBtn");
customerDateText.textContent = new Date().toLocaleDateString("bn-BD", {
  day:"numeric",
  month:"short"
});

  function setupFloating( input, box ){
    if(!input || !box) return;

    input.addEventListener("focus", ()=>{
      box.classList.add("active");
    });

    input.addEventListener("blur", ()=>{
  if(input.value.trim()){
    box.classList.remove("active");
    box.classList.add("has-value");
  }else{
    box.classList.remove("active");
    box.classList.remove("has-value");
  }
});

    input.addEventListener("input", ()=>{
  if(input.value.trim()){
    box.classList.add("has-value");
  }else{
    box.classList.remove("has-value");
  }

  updateSaveButton();
});
  }

  setupFloating(nameInput, nameBox);
  setupFloating(phoneInput, phoneBox);
setupFloating(openingInput, openingBox);

openingBox.classList.remove("active","has-value");
phoneBox.classList.remove("active","has-value");
nameBox.classList.remove("active","has-value");

openingInput.value = "";
phoneInput.value = "";
nameInput.value = "";

openingBox.style.display = "none";
if(customerDateBtn) customerDateBtn.style.display = "none";
if(customerAttachBtn) customerAttachBtn.style.display = "none";
  

  function updateSaveButton(){
if(window.__editModeActive){
  return;
}
  if(window.__editModeActive){
    return;
  }

  const name = nameInput.value.trim();

  const warning = document.getElementById("customerNameWarning");
  const error = document.getElementById("customerNameError");
  const openingBox = document.getElementById("openingBalContainer");

  if(name.length >= 3 && name.length <= 35){
  saveBtn.classList.add("active");

  if(warning) warning.style.display = "none";
  if(error) error.style.display = "none";

  if(openingBox) openingBox.style.display = "flex";
  if(customerDateBtn) customerDateBtn.style.display = "flex";
  if(customerAttachBtn) customerAttachBtn.style.display = "flex";

}else{
  saveBtn.classList.remove("active");

  if(name.length > 0){
    if(warning) warning.style.display = "block";
    if(error) error.style.display = "block";
  }else{
    if(warning) warning.style.display = "none";
    if(error) error.style.display = "none";
  }

  if(openingBox) openingBox.style.display = "none";
  if(customerDateBtn) customerDateBtn.style.display = "none";
  if(customerAttachBtn) customerAttachBtn.style.display = "none";
}
}

window.resetCustomerFormUI = function(){
  nameInput.value = "";
  phoneInput.value = "";
  openingInput.value = "";

  nameBox.classList.remove("active","has-value");
  phoneBox.classList.remove("active","has-value");
  openingBox.classList.remove("active","has-value");

  openingBox.style.display = "none";

  document.getElementById("customerNameWarning").style.display = "none";
  document.getElementById("customerNameError").style.display = "none";

  saveBtn.classList.remove("active");

  avatarPreview.src = "";
avatarPreview.style.display = "none";
avatarIcon.style.display = "block";

  customerPremiumState.avatarImage = "";
customerPremiumState.attachedPhoto = "";
customerPremiumState.selectedDate = new Date();
customerPremiumState.userType = "customer";

customerDateText.textContent = new Date().toLocaleDateString("bn-BD", {
  day:"numeric",
  month:"short"
});
}

  customerBtn.onclick = ()=>{
    customerPremiumState.userType = "customer";
    customerBtn.classList.add("active");
    supplierBtn.classList.remove("active");
  };

  supplierBtn.onclick = ()=>{
    customerPremiumState.userType = "supplier";
    supplierBtn.classList.add("active");
    customerBtn.classList.remove("active");
  };

  function openPicker(){
    avatarPickerBackdrop.classList.add("show");
    avatarPickerSheet.classList.add("show");
  }

  function closePicker(){
    avatarPickerBackdrop.classList.remove("show");
    avatarPickerSheet.classList.remove("show");
  }

  document.getElementById("openAvatarPickerBtn").onclick = ()=>{
  openPicker();
};
  avatarPickerBackdrop.onclick = closePicker;

  document.getElementById("pickCameraBtn").onclick = ()=>{
    closePicker();
    cameraInput.click();
  };

document.getElementById("pickGalleryBtn").onclick = ()=>{
  closePicker();
  galleryInput.click();
};

if(deleteAvatarBtn){
  deleteAvatarBtn.onclick = ()=>{
    closePicker();

    customerPremiumState.avatarImage = "";
    avatarPreview.src = "";
    avatarPreview.style.display = "none";
    avatarIcon.style.display = "block";

    if(typeof window.onAvatarChanged === "function"){
      window.onAvatarChanged();
    }
  };
}

  function loadAvatar(file){
    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(e){
  customerPremiumState.avatarImage = e.target.result;
  avatarPreview.src = e.target.result;
  avatarPreview.style.display = "block";
  avatarIcon.style.display = "none";

  if(typeof window.onAvatarChanged === "function"){
      window.onAvatarChanged();
    }
};

    reader.readAsDataURL(file);
  }

  cameraInput.onchange = e => loadAvatar(e.target.files[0]);
  galleryInput.onchange = e => loadAvatar(e.target.files[0]);

  document.getElementById("customerAttachPhotoBtn").onclick = ()=>{
  attachPhotoInput.setAttribute("capture","environment");
  attachPhotoInput.click();
};

  attachPhotoInput.onchange = e=>{
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = function(ev){
      customerPremiumState.attachedPhoto = ev.target.result;
    };

    reader.readAsDataURL(file);
  };

  customerDateBtn.onclick = ()=>{
    if(customerDatePicker.showPicker){
      customerDatePicker.showPicker();
    }else{
      customerDatePicker.click();
    }
  };

  customerDatePicker.onchange = ()=>{
    if(customerDatePicker.value){
      customerPremiumState.selectedDate = new Date(customerDatePicker.value);
      customerDateText.textContent =
        customerPremiumState.selectedDate.toLocaleDateString("bn-BD", {
          day:"numeric",
          month:"short"
        });
    }
  };

  document.getElementById("importContactBtn").onclick = async ()=>{
    try{
      if("contacts" in navigator && "ContactsManager" in window){
        const contacts = await navigator.contacts.select(
          ["name","tel"],
          { multiple:false }
        );

        if(contacts.length){
          if(contacts[0].name){
            nameInput.value = contacts[0].name[0] || "";
            nameBox.classList.add("has-value");
          }

          if(contacts[0].tel){
            phoneInput.value = contacts[0].tel[0] || "";
            phoneBox.classList.add("has-value");
          }

          updateSaveButton();
        }
      }else{
        alert("এই ডিভাইসে ফোনবুক সাপোর্ট নেই");
      }
    }catch(e){}
  };
}

function showCustomerSuccess(message){
  const overlay = document.getElementById("customerSuccessOverlay");
  const text = document.getElementById("customerSuccessText");

  text.textContent = message;

  overlay.classList.add("show");

  setTimeout(()=>{
    overlay.classList.remove("show");
  }, 2000);
}