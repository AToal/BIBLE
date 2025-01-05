document.onclick = hideXtraNav;
document.oncontextmenu = rightClick;

function hideXtraNav() {
   document.getElementById("xtraNav")
      .style.display = "none"
};

function rightClick(e) {
   e.preventDefault();

   if (document.getElementById("xtraNav").style.display == "block") {
      hideXtraNav();
   } else {
      var menu = document.getElementById("xtraNav")
      menu.style.display = 'block';
      menu.style.left = (e.pageX - 75) + "px";
      menu.style.top = (e.pageY - 158) + "px";
   }
};
