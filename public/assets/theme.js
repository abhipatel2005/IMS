let change = document.querySelector("#toggleButton");
let change_icon1 = document.querySelector("#sunny");
let change_icon2 = document.querySelector("#moon");

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
        } else {
            change_icon1.classList.remove("change_icon");
            change_icon2.classList.add("change_icon");
            change.classList.remove("on");
        }
    }
});

change.addEventListener("click", () => {

    changeTheme();

    if (document.body.getAttribute("data-bs-theme") !== "light") {
        change_icon1.classList.add("change_icon");
        change_icon2.classList.remove("change_icon");
        change.classList.add("on");
    } else {
        change_icon1.classList.remove("change_icon");
        change_icon2.classList.add("change_icon");
        change.classList.remove("on");
    }
});