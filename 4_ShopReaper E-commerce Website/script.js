
function makeOfflineFallbackSVG(label) {
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="260" viewBox="0 0 400 260">' +
    '<rect width="100%" height="100%" fill="#1e293b"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="15" fill="#f8fafc" font-weight="600">' +
    (label || "ShopReaper") +
    "</text>" +
    "</svg>";
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}


document.querySelectorAll("img[data-label]").forEach(function (img) {
  img.addEventListener("error", function () {
    img.src = makeOfflineFallbackSVG(img.getAttribute("data-label"));
  });
});

function safeGetStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function safeSetStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

function showToast(msg) {
  var toast = document.getElementById("toast-msg");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(function () {
    toast.style.display = "none";
  }, 2000);
}

var searchBox = document.getElementById("search-input");
var filterBtns = document.querySelectorAll(".filter-btn");
var activeCat = "all";

function filterItems() {
  var query = searchBox ? searchBox.value.toLowerCase().trim() : "";
  var cards = document.querySelectorAll("#products-list .item-box");

  cards.forEach(function (card) {
    var title = card.querySelector("h3").textContent.toLowerCase();
    var cat = card.getAttribute("data-category");
    var matchText = title.indexOf(query) !== -1;
    var matchCat = activeCat === "all" || cat === activeCat;

    card.style.display = matchText && matchCat ? "flex" : "none";
  });
}

if (searchBox) {
  searchBox.addEventListener("input", filterItems);
}

filterBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    filterBtns.forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    activeCat = btn.getAttribute("data-filter");
    filterItems();
  });
});


function getCart() {
  var stored = safeGetStorage("shopreaper_cart_v3");
  return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
  safeSetStorage("shopreaper_cart_v3", JSON.stringify(cart));
  updateCartCount();
  renderCartTable();
}

function updateCartCount() {
  var cart = getCart();
  var count = 0;
  for (var i = 0; i < cart.length; i++) {
    count += cart[i].quantity;
  }
  var badge = document.getElementById("cart-count");
  if (badge) badge.textContent = count;
}

document.querySelectorAll(".add-to-cart-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var name = btn.getAttribute("data-name");
    var price = Number(btn.getAttribute("data-price"));
    var cart = getCart();
    var found = null;

    for (var i = 0; i < cart.length; i++) {
      if (cart[i].name === name) {
        found = cart[i];
        break;
      }
    }

    if (found) {
      found.quantity += 1;
    } else {
      cart.push({ name: name, price: price, quantity: 1 });
    }

    saveCart(cart);
    showToast(name + " added to cart.");
  });
});

function changeQty(index, delta) {
  var cart = getCart();
  if (!cart[index]) return;
  cart[index].quantity += delta;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  saveCart(cart);
}

function removeFromCart(index) {
  var cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function renderCartTable() {
  var tbody = document.getElementById("cart-items");
  var totalEl = document.getElementById("cart-total");
  if (!tbody || !totalEl) return;

  var cart = getCart();
  tbody.innerHTML = "";
  var total = 0;

  if (cart.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">Your cart is currently empty.</td></tr>';
    totalEl.textContent = "0";
    return;
  }

  cart.forEach(function (item, idx) {
    var sub = item.price * item.quantity;
    total += sub;
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + item.name + "</td>" +
      "<td>₹" + item.price.toLocaleString("en-IN") + "</td>" +
      "<td>" +
      '<button class="qty-btn" onclick="changeQty(' + idx + ', -1)">-</button>' +
      "<span>" + item.quantity + "</span>" +
      '<button class="qty-btn" onclick="changeQty(' + idx + ', 1)">+</button>' +
      "</td>" +
      "<td>₹" + sub.toLocaleString("en-IN") + "</td>" +
      '<td><button class="outline-btn" onclick="removeFromCart(' + idx + ')">Remove</button></td>';
    tbody.appendChild(tr);
  });

  totalEl.textContent = total.toLocaleString("en-IN");
}

var clearBtn = document.getElementById("clear-cart-btn");
if (clearBtn) {
  clearBtn.addEventListener("click", function () {
    saveCart([]);
    showToast("Cart cleared.");
  });
}

updateCartCount();
renderCartTable();

// -------------------------------------------------------
// Feature 5: Dark Mode Toggle
// -------------------------------------------------------
var themeToggleBtn = document.getElementById("theme-toggle");

function loadTheme() {
  if (safeGetStorage("shopreaper_theme") === "dark") {
    document.body.classList.add("dark-mode");
    if (themeToggleBtn) themeToggleBtn.textContent = "Light Mode";
  }
}
loadTheme();

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    var isDark = document.body.classList.contains("dark-mode");
    safeSetStorage("shopreaper_theme", isDark ? "dark" : "light");
    themeToggleBtn.textContent = isDark ? "Light Mode" : "Dark Mode";
  });
}

// -------------------------------------------------------
// Feature 6: Contact Us Form Validation
// -------------------------------------------------------
var form = document.getElementById("contact-form");
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("fullName").value.trim();
    var email = document.getElementById("email").value.trim();
    var phone = document.getElementById("phone").value.trim();
    var subject = document.getElementById("subject").value.trim();
    var msg = document.getElementById("message").value.trim();
    var feedback = document.getElementById("form-feedback");

    if (!name || !email || !phone || !subject || !msg) {
      feedback.style.color = "#e11d48";
      feedback.textContent = "Please fill in all fields before submitting.";
      return;
    }

    if (email.indexOf("@") === -1 || email.indexOf(".") === -1) {
      feedback.style.color = "#e11d48";
      feedback.textContent = "Please enter a valid email address.";
      return;
    }

    feedback.style.color = "#16a34a";
    feedback.textContent = "Thank you, " + name + ". Your message has been sent.";
    form.reset();
  });
}

// -------------------------------------------------------
// Feature 7: Product Details Popup Modal
// -------------------------------------------------------
var modal = document.getElementById("product-modal");
var modalImg = document.getElementById("modal-img");
var modalTitle = document.getElementById("modal-title");
var modalPrice = document.getElementById("modal-price");
var modalDesc = document.getElementById("modal-desc");
var closeBtn1 = document.getElementById("close-modal-btn");
var closeBtn2 = document.getElementById("modal-close-action");

document.querySelectorAll(".view-details-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var name = btn.getAttribute("data-name");
    var price = Number(btn.getAttribute("data-price"));
    var desc = btn.getAttribute("data-desc");
    var imgUrl = btn.getAttribute("data-img");

    modalTitle.textContent = name;
    modalPrice.textContent = "₹" + price.toLocaleString("en-IN");
    modalDesc.textContent = desc;
    modalImg.src = imgUrl || makeOfflineFallbackSVG(name);
    modal.style.display = "flex";
  });
});

function hideModal() {
  if (modal) modal.style.display = "none";
}

if (closeBtn1) closeBtn1.addEventListener("click", hideModal);
if (closeBtn2) closeBtn2.addEventListener("click", hideModal);

// -------------------------------------------------------
// Feature 8: Wishlist (Add / Remove Products from Wishlist)
// -------------------------------------------------------
function getWishlist() {
  var stored = safeGetStorage("shopreaper_wishlist_v3");
  return stored ? JSON.parse(stored) : [];
}

function saveWishlist(list) {
  safeSetStorage("shopreaper_wishlist_v3", JSON.stringify(list));
  updateWishlistUI();
}

function updateWishlistUI() {
  var list = getWishlist();
  var countEl = document.getElementById("wishlist-count");
  if (countEl) countEl.textContent = list.length;

  document.querySelectorAll(".wishlist-btn").forEach(function (btn) {
    var name = btn.getAttribute("data-name");
    var exists = list.some(function (item) {
      return item.name === name;
    });
    btn.classList.toggle("active", exists);
    btn.textContent = exists ? "Saved" : "Wishlist";
  });

  var ul = document.getElementById("wishlist-items");
  if (!ul) return;
  ul.innerHTML = "";

  if (list.length === 0) {
    ul.innerHTML = "<li>No products in your wishlist yet.</li>";
    return;
  }

  list.forEach(function (item, index) {
    var li = document.createElement("li");
    li.innerHTML =
      "<span><strong>" + item.name + "</strong> — ₹" + Number(item.price).toLocaleString("en-IN") + "</span>" +
      '<button class="outline-btn" onclick="removeFromWishlist(' + index + ')">Remove</button>';
    ul.appendChild(li);
  });
}

function removeFromWishlist(index) {
  var list = getWishlist();
  var removed = list.splice(index, 1);
  saveWishlist(list);
  if (removed[0]) showToast(removed[0].name + " removed from wishlist.");
}

document.querySelectorAll(".wishlist-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var name = btn.getAttribute("data-name");
    var price = Number(btn.getAttribute("data-price"));
    var list = getWishlist();
    var idx = -1;

    for (var i = 0; i < list.length; i++) {
      if (list[i].name === name) {
        idx = i;
        break;
      }
    }

    if (idx !== -1) {
      list.splice(idx, 1);
      showToast(name + " removed from wishlist.");
    } else {
      list.push({ name: name, price: price });
      showToast(name + " saved to wishlist.");
    }

    saveWishlist(list);
  });
});

updateWishlistUI();

// -------------------------------------------------------
// Feature 9: Back to Top Button
// -------------------------------------------------------
var backToTopBtn = document.getElementById("back-to-top");
if (backToTopBtn) {
  window.addEventListener("scroll", function () {
    if (window.scrollY > 200) {
      backToTopBtn.style.display = "block";
    } else {
      backToTopBtn.style.display = "none";
    }
  });

  backToTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// -------------------------------------------------------
// Feature 10: Promotional Banner Image Slider (Home Page)
// -------------------------------------------------------
var slidesData = [
  {
    badge: "MOTORSPORT DROP 01 / 03",
    heading: "PUMA × BMW M Motorsport Catch Sneakers",
    text: "Track-inspired court silhouette in official Motorsport colors. Now available at ₹4,499.",
    img: "https://images.puma.com/image/upload/f_auto,q_auto,b_rgb:fafafa,w_2000,h_2000/global/309208/01/sv01/fnd/IND/fmt/png/BMW-M-Motorsport-Catch-Sneakers"
  },
  {
    badge: "FLAGSHIP AUDIO 02 / 03",
    heading: "Sony WH-CH720N Wireless ANC Headphones",
    text: "Integrated Processor V1 noise canceling with 35-hour battery life at ₹8,990.",
    img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=900&q=85"
  },
  {
    badge: "WINTER STREETWEAR 03 / 03",
    heading: "PUMA Scuderia Ferrari Race Fleece Hoodie",
    text: "Heavyweight 320 GSM brushed cotton fleece pullover at ₹3,299.",
    img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85"
  }
];

var currentSlide = 0;
var sliderHeading = document.getElementById("slider-heading");
var sliderText = document.getElementById("slider-text");
var sliderImg = document.getElementById("slider-img");
var slideBadge = document.getElementById("slide-badge");
var prevSlideBtn = document.getElementById("prev-slide-btn");
var nextSlideBtn = document.getElementById("next-slide-btn");

function showSlide(index) {
  if (!sliderHeading || !sliderImg) return;
  currentSlide = (index + slidesData.length) % slidesData.length;
  var s = slidesData[currentSlide];
  if (slideBadge) slideBadge.textContent = s.badge;
  sliderHeading.textContent = s.heading;
  sliderText.textContent = s.text;
  sliderImg.src = s.img;
}

if (prevSlideBtn && nextSlideBtn) {
  prevSlideBtn.addEventListener("click", function () {
    showSlide(currentSlide - 1);
  });
  nextSlideBtn.addEventListener("click", function () {
    showSlide(currentSlide + 1);
  });
  setInterval(function () {
    showSlide(currentSlide + 1);
  }, 4500);
}

// Interactive Shop Now Button
var shopNowBtn = document.getElementById("shop-now-btn");
if (shopNowBtn) {
  shopNowBtn.addEventListener("click", function () {
    var featured = document.getElementById("featured-products");
    if (featured) featured.scrollIntoView({ behavior: "smooth" });
  });
}
