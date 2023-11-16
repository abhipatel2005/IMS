// add hovered class to selected list item
let list = document.querySelectorAll(".navigation li");

function activeLink() {
  list.forEach((item) => {
    item.classList.remove("hovered");
  });
  this.classList.add("hovered");
}

list.forEach((item) => item.addEventListener("mouseover", activeLink));

// Menu Toggle
let toggle = document.querySelector(".toggle");
let navigation = document.querySelector(".navigation");
let main = document.querySelector(".main");

toggle.onclick = function () {
  navigation.classList.toggle("active");
  main.classList.toggle("active");
};


//search js
  // $(document).ready(function () {
  //   $('#searchInput').on('input', function () {
  //     const query = $(this).val();

  //     $.ajax({
  //       url: `/get_data/data/search?query=${query}`,
  //       method: 'GET',
  //       success: function (data) {
  //         $('#searchResults').html(data);
  //       },
  //       error: function (error) {
  //         console.error('Error fetching search results:', error);
  //       },
  //     });
  //   });
  // });