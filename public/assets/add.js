const dropdown1 = document.getElementById('dropdown1');
const dropdown2 = document.getElementById('dropdown2');
const dropdown3 = document.getElementById('dropdown3');

const optionsMap1 = {
  choose: ['Choose...'],
  it_products: ['Choose...', 'Desktop Computers', 'Laptop Notebook', 'Computer Printers', 'Tablet Computers'],
  furniture: ['Choose...', 'Class Room Desking', 'Excutive Table', 'Revolving chair'],
  stationary_items: ['Choose...', 'Diaries', 'Gel Pen'],
  electrical_appliance: ['Choose...', 'Lead Luminaire', 'MCCB'],
  electrical_equipments: ['Choose...', 'Television Tv', 'Fridge'],
  pipes_fitting: ['Choose...', 'Steel tubes', 'CPVC'],
};

const optionsMap2 = {
  'Choose...': ['Choose...'],
  'Desktop Computers': ['Choose...', 'Dell Core i5', 'HP Core i5', 'Asus Core i5', 'Lenovo Core i5'],
  'Laptop Notebook': ['Choose...', 'RDP Core i5', 'Coconics Core i7', 'AXL Core i3'],
  'Computer Printers': ['Choose...', 'Lecpure Inject Printer', 'Hp 1212 Printer', 'BANDHARA Inject Printer'],
  'Tablet Computers': ['Choose...', 'Samsung Tablet 4GB', 'IRA Tablet 2GB 32GB', 'Acer Tablet 2GB 32GB'],
  'Class Room Desking': ['Choose...', 'Duster', 'Chalk Box'],
  'Excutive Table': ['Choose...', 'ELIMS', 'Welfing'],
  'Revolving chair': ['Choose...', 'Faculty Chair', 'Lab Chair'],
  'Diaries': ['Choose...', 'Faculty Diary', 'Student Diary'],
  'Gel Pen': ['Choose...', 'Reynolds', 'Hauser'],
  'Lead Luminaire': ['Choose...', 'Surya', 'Hawells'],
  'MCCB': ['Choose...', 'Legrand', 'LNT'],
  'Television Tv': ['Choose...', 'Sony', 'LG'],
  'Fridge': ['Choose...', 'LG', 'Voltas'],
  'Steel tubes': ['Choose...', 'ARE 15', 'ARE 25'],
  'CPVC': ['Choose...', 'Astral', 'Vigor'],
};


function updateSecondDropdown() {
  const selectedOption1 = dropdown1.value;
  const options1 = optionsMap1[selectedOption1] || [];

  dropdown2.innerHTML = '';

  options1.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    dropdown2.appendChild(optionElement);
  });

  // After updating the second dropdown, also update the third dropdown
  updateThirdDropdown();
}

function updateThirdDropdown() {
  const selectedOption2 = dropdown2.value;
  const options2 = optionsMap2[selectedOption2] || [];

  dropdown3.innerHTML = '';

  options2.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    dropdown3.appendChild(optionElement);
  });
}

dropdown1.addEventListener('change', updateSecondDropdown);
dropdown2.addEventListener('change', updateThirdDropdown);

updateSecondDropdown();
updateThirdDropdown();

function validateForm() {
  let category = document.getElementById("dropdown1").value;
  let sub_category = document.getElementById("dropdown2").value;
  let specification = document.getElementById("dropdown3").value;

  if (category === 'Choose...' || sub_category === 'Choose...' || specification === 'Choose...') {
    alert('Please select a valid option for Category, Sub-Category, and Specification.');
    return; // Do not proceed with form submission
  }
}

//for dark mode on and off

let change = document.querySelector("#toggleButton");
let change_icon1 = document.querySelector("#sunny");
let change_icon2 = document.querySelector("#moon");
let noChange = document.querySelector(".img");

function changeTheme() {
  let element = document.body;
  element.dataset.bsTheme = element.dataset.bsTheme == "light" ? "dark" : "light";
  localStorage.setItem('theme', element.dataset.bsTheme); // Save the current theme in localStorage
}

// Load the theme from localStorage when the page loads
document.addEventListener("DOMContentLoaded", () => {
  let storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    document.body.dataset.bsTheme = storedTheme;
    if (storedTheme !== "light") {
      change_icon1.classList.add("change_icon");
      change_icon2.classList.remove("change_icon");
      change.classList.add("on");
      noChange.classList.add("nochange");
    } else {
      change_icon1.classList.remove("change_icon");
      change_icon2.classList.add("change_icon");
      change.classList.remove("on");
      noChange.classList.remove("nochange")
    }
  }
});

change.addEventListener("click", () => {

  changeTheme();

  if (document.body.getAttribute("data-bs-theme") !== "light") {
    change_icon1.classList.add("change_icon");
    change_icon2.classList.remove("change_icon");
    change.classList.add("on");
    noChange.classList.add("nochange");

  } else {
    change_icon1.classList.remove("change_icon");
    change_icon2.classList.add("change_icon");
    change.classList.remove("on");
    noChange.classList.remove("nochange");
  }
});