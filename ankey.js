// Menu data
const MENU = [
  {id:1,  n:"Margherita Pizza",  d:"Tomato, mozzarella, fresh basil",  p:11.5, c:"Mains",   e:"🍕"},
  {id:2,  n:"Smash Burger",      d:"Double patty, cheddar, pickles",   p:12,   c:"Mains",   e:"🍔"},
  {id:3,  n:"Chicken Biryani",   d:"Spiced basmati, tender chicken",   p:13.5, c:"Mains",   e:"🍛"},
  {id:4,  n:"Pad Thai",          d:"Rice noodles, peanuts, lime",      p:12.5, c:"Mains",   e:"🍜"},
  {id:5,  n:"Salmon Sushi Set",  d:"8 pieces, soy and wasabi",         p:15,   c:"Mains",   e:"🍣"},
  {id:6,  n:"Crispy Fries",      d:"Sea salt, garlic dip",             p:4.5,  c:"Sides",   e:"🍟"},
  {id:7,  n:"Garden Salad",      d:"Greens, cucumber, lemon dressing", p:6,    c:"Sides",   e:"🥗"},
  {id:8,  n:"Chocolate Brownie", d:"Warm, with a scoop of vanilla",    p:5.5,  c:"Dessert", e:"🍫"},
  {id:9,  n:"Mango Lassi",       d:"Chilled yogurt and mango",         p:4,    c:"Drinks",  e:"🥭"},
  {id:10, n:"Iced Lemon Tea",    d:"Brewed daily, lightly sweet",      p:3.5,  c:"Drinks",  e:"🍋"}
];

const FEE = 2.5;
const cats = ["All", ...new Set(MENU.map(m => m.c))];

// App state
let cat = "All";
let cart = {};
let placed = false;

// Load saved cart (safe if storage is unavailable)
try { cart = JSON.parse(localStorage.getItem("cart") || "{}"); } catch (e) { cart = {}; }

// Helpers
const $ = id => document.getElementById(id);
const money = n => "$" + n.toFixed(2);
const save = () => { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) {} };

// Category tabs
function tabs() {
  $("tabs").innerHTML = cats.map(c =>
    `<button class="tab" aria-pressed="${c === cat}" data-c="${c}">${c}</button>`
  ).join("");
}

// Menu cards
function menu() {
  $("menu").innerHTML = MENU.filter(m => cat === "All" || m.c === cat).map(m => `
    <article class="item">
      <div class="pic" aria-hidden="true">${m.e}</div>
      <h3>${m.n}</h3>
      <p>${m.d}</p>
      <div class="row">
        <span class="price">${money(m.p)}</span>
        <button class="add" data-add="${m.id}">Add to cart</button>
      </div>
    </article>`).join("");
}

// Cart panel
function render() {
  const ids = Object.keys(cart);
  const n = ids.reduce((s, i) => s + cart[i], 0);
  $("count").textContent = n;
  const b = $("body");

  if (placed) {
    b.innerHTML = `<div class="done"><div class="big">🎉</div><h2>Order placed</h2><p>Thanks! Your food is on its way and should arrive in about 30 minutes.</p><button class="go" id="again">Order again</button></div>`;
    return;
  }
  if (!n) {
    b.innerHTML = `<p class="empty">Your cart is empty. Add a dish from the menu to get started.</p>`;
    return;
  }

  const sub = ids.reduce((s, i) => s + MENU.find(m => m.id == i).p * cart[i], 0);

  b.innerHTML = `<div id="lines">${ids.map(i => {
    const m = MENU.find(x => x.id == i);
    return `
      <div class="line">
        <span style="font-size:1.6rem">${m.e}</span>
        <div class="n">${m.n}<small>${money(m.p)} each</small></div>
        <div class="qty">
          <button data-dec="${i}" aria-label="Remove one ${m.n}">−</button>
          <span>${cart[i]}</span>
          <button data-inc="${i}" aria-label="Add one ${m.n}">+</button>
        </div>
      </div>`;
  }).join("")}</div>
  <div class="sum"><span>Subtotal</span><span>${money(sub)}</span></div>
  <div class="sum"><span>Delivery</span><span>${money(FEE)}</span></div>
  <div class="sum t"><span>Total</span><span>${money(sub + FEE)}</span></div>
  <form id="f" novalidate>
    <input name="name" placeholder="Full name" autocomplete="name" required>
    <input name="phone" placeholder="Phone number" inputmode="tel" autocomplete="tel" required>
    <input name="addr" placeholder="Delivery address" autocomplete="street-address" required>
    <p class="err" id="err" role="alert"></p>
    <button class="go" type="submit">Place order · ${money(sub + FEE)}</button>
  </form>`;
}

// Change quantity of an item
const set = (id, d) => {
  cart[id] = (cart[id] || 0) + d;
  if (cart[id] <= 0) delete cart[id];
  save();
  render();
};

// Open / close the cart drawer
const toggle = on => {
  $("cart").classList.toggle("on", on);
  $("shade").classList.toggle("on", on);
};

// Click handling
document.addEventListener("click", e => {
  const t = e.target.closest("button");
  if (!t) return;
  if (t.dataset.c) {
    cat = t.dataset.c;
    tabs();
    menu();
  } else if (t.dataset.add) {
    placed = false;
    set(+t.dataset.add, 1);
    $("count").animate([{transform: "scale(1.4)"}, {transform: "scale(1)"}], 200);
  } else if (t.dataset.inc) {
    set(t.dataset.inc, 1);
  } else if (t.dataset.dec) {
    set(t.dataset.dec, -1);
  } else if (t.id === "again") {
    placed = false;
    toggle(false);
    render();
  }
});

$("open").onclick = () => { toggle(true); render(); };
$("close").onclick = $("shade").onclick = () => toggle(false);
document.addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });

// Checkout form
document.addEventListener("submit", e => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(e.target));
  if (!v.name.trim() || !v.addr.trim()) {
    $("err").textContent = "Enter your name and delivery address.";
    return;
  }
  if (!/^[+\d][\d\s()-]{6,}$/.test(v.phone.trim())) {
    $("err").textContent = "Enter a valid phone number.";
    return;
  }
  cart = {};
  save();
  placed = true;
  render();
});

// Start
tabs();
menu();
render();