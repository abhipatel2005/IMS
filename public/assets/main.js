// // add hovered class to selected list item
// let list = document.querySelectorAll(".navigation li");

// function activeLink() {
//   list.forEach((item) => {
//     item.classList.remove("hovered");
//   });
//   this.classList.add("hovered");
// }

// list.forEach((item) => item.addEventListener("mouseover", activeLink));

// // Menu Toggle
// let toggle = document.querySelector(".toggle");
// let navigation = document.querySelector(".navigation");
// let main = document.querySelector(".main");
// let icon_open = document.querySelector(".simple");
// let icon_close = document.querySelector(".close_icon");

// function changeText() {
//   var x = document.querySelector("h2");
//   if (x.innerHTML === "IMS") {
//     x.innerHTML = "Inventory Management!";
//   } else {
//     x.innerHTML = "IMS";
//   }
// }

// toggle.onclick = function () {
//   navigation.classList.toggle("active");
//   main.classList.toggle("active");
//   toggle.classList.toggle("toggle_transition");
//   icon_close.classList.toggle("open_icon");
//   icon_open.classList.toggle("close_icon");
// };