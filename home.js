const homeScreen = document.getElementById("homeScreen");
const customerList = document.getElementById("customerList");
const customerCount = document.getElementById("customerCount");
const totalReceive = document.getElementById("totalReceive");
const totalGive = document.getElementById("totalGive");
const searchInput = document.getElementById("searchInput");
const openCustomerModal = document.getElementById("openCustomerModal");

if(openCustomerModal){
  openCustomerModal.onclick = openAddCustomer;
}

