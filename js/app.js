// ================================================
// AD filmstudio — Main Application
// ================================================

(function () {
  'use strict';

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzXAF34GfGwpqsdvMIbzkwW9MKaUmZiWQkqzgm40nAtumFxe1dNlKwd3qLcXQwSu870/exec';
  const SHIPPING_FEE = 4000;

  // ---- Product Data ----
  const products = {
    small: {
      nameKey: 'product_small_name',
      format: '35mm / 36x24',
      basePrice: 45000,
      glassPrice: 65000,
      tubePrice: 15000,
      rollerPrice: 8000,
      show110: false,
      showAPS: false,
    },
    medium: {
      nameKey: 'product_medium_name',
      format: '120 / 6x4.5 ~ 6x9',
      basePrice: 55000,
      glassPrice: 78000,
      tubePrice: 18000,
      rollerPrice: 10000,
      show110: false,
      showAPS: false,
    },
    multi: {
      nameKey: 'product_multi_name',
      format: '35mm + 120 + 110 + APS',
      basePrice: 75000,
      glassPrice: 98000,
      tubePrice: 20000,
      rollerPrice: 12000,
      price110: 8000,
      priceAPS: 8000,
      show110: true,
      showAPS: true,
    },
  };

  let currentProduct = null;
  let cart = [];

  // ---- DOM refs ----
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav-link');
  const productLinks = document.querySelectorAll('.product-link');
  const backBtn = document.getElementById('backToShop');
  const cartBtn = document.getElementById('cartBtn');
  const cartSidebar = document.getElementById('cartSidebar');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotal = document.getElementById('cartTotal');
  const langToggle = document.getElementById('langToggle');
  const addToCartBtn = document.getElementById('addToCartBtn');

  // Checkout elements
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutItems = document.getElementById('checkoutItems');
  const checkoutSubtotal = document.getElementById('checkoutSubtotal');
  const checkoutTotal = document.getElementById('checkoutTotal');
  const submitOrderBtn = document.getElementById('submitOrderBtn');
  const zipSearchBtn = document.getElementById('zipSearchBtn');
  const custName = document.getElementById('custName');
  const custPhone = document.getElementById('custPhone');
  const custEmail = document.getElementById('custEmail');
  const custZip = document.getElementById('custZip');
  const custAddress = document.getElementById('custAddress');
  const custDetailAddress = document.getElementById('custDetailAddress');
  const checkoutConfirmation = document.getElementById('checkoutConfirmation');
  const confirmOrderId = document.getElementById('confirmOrderId');
  const confirmAmount = document.getElementById('confirmAmount');
  const confirmBackBtn = document.getElementById('confirmBackBtn');

  // Config elements
  const configProductName = document.getElementById('configProductName');
  const configProductFormat = document.getElementById('configProductFormat');
  const optScanTube = document.getElementById('optScanTube');
  const scanTubeOptions = document.getElementById('scanTubeOptions');
  const tubeLength = document.getElementById('tubeLength');
  const tubeLengthValue = document.getElementById('tubeLengthValue');
  const adapterSize = document.getElementById('adapterSize');
  const optRoller = document.getElementById('optRoller');
  const opt110 = document.getElementById('opt110');
  const optAPS = document.getElementById('optAPS');
  const opt110Group = document.getElementById('opt110Group');
  const optAPSGroup = document.getElementById('optAPSGroup');
  const totalPrice = document.getElementById('totalPrice');

  // Model elements
  const modelTube = document.getElementById('modelTube');
  const tubeSegment = document.getElementById('tubeSegment');
  const modelRoller = document.getElementById('modelRoller');
  const modelAdapter = document.getElementById('modelAdapter');
  const modelBody = document.querySelector('.model-body');

  // ---- Navigation ----
  function showPage(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + pageId);
    if (target) target.classList.add('active');

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.nav === pageId);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showPage(link.dataset.nav);
    });
  });

  // ---- Product Detail ----
  function openProduct(productKey) {
    currentProduct = productKey;
    const prod = products[productKey];

    configProductName.textContent = t(prod.nameKey);
    configProductFormat.textContent = prod.format;

    // Reset options
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === 'standard');
    });
    optScanTube.checked = false;
    scanTubeOptions.style.display = 'none';
    tubeLength.value = 100;
    tubeLengthValue.textContent = '100mm';
    adapterSize.value = '52';
    optRoller.checked = false;
    opt110.checked = false;
    optAPS.checked = false;

    // Show/hide 110 and APS options
    opt110Group.style.display = prod.show110 ? 'block' : 'none';
    optAPSGroup.style.display = prod.showAPS ? 'block' : 'none';

    // Reset model
    modelTube.style.display = 'none';
    modelRoller.style.display = 'none';
    modelAdapter.style.display = 'none';

    // Scale model body based on product type
    if (productKey === 'small') {
      modelBody.style.width = '80px';
      modelBody.style.height = '100px';
    } else if (productKey === 'medium') {
      modelBody.style.width = '110px';
      modelBody.style.height = '130px';
    } else {
      modelBody.style.width = '120px';
      modelBody.style.height = '140px';
    }

    updatePrice();
    showPage('product');
  }

  productLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openProduct(link.dataset.product);
    });
  });

  backBtn.addEventListener('click', () => showPage('shop'));

  // ---- Configurator Logic ----

  // Version toggle
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn[data-option="' + btn.dataset.option + '"]').forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      // Glass version visual feedback
      if (btn.dataset.value === 'glass') {
        modelBody.style.background = 'linear-gradient(135deg, var(--gray-800), var(--gray-600))';
        modelBody.style.boxShadow = 'inset 0 0 30px rgba(255,255,255,0.1)';
      } else {
        modelBody.style.background = 'var(--gray-800)';
        modelBody.style.boxShadow = 'none';
      }

      updatePrice();
    });
  });

  // Scan tube checkbox
  optScanTube.addEventListener('change', () => {
    scanTubeOptions.style.display = optScanTube.checked ? 'block' : 'none';
    modelTube.style.display = optScanTube.checked ? 'block' : 'none';
    modelAdapter.style.display = optScanTube.checked ? 'block' : 'none';
    if (optScanTube.checked) {
      updateTubeModel();
    }
    updatePrice();
  });

  // Tube length slider
  tubeLength.addEventListener('input', () => {
    tubeLengthValue.textContent = tubeLength.value + 'mm';
    updateTubeModel();
    updatePrice();
  });

  // Adapter size
  adapterSize.addEventListener('change', () => {
    updateAdapterModel();
    updatePrice();
  });

  // Metal roller
  optRoller.addEventListener('change', () => {
    modelRoller.style.display = optRoller.checked ? 'block' : 'none';
    updatePrice();
  });

  // 110 & APS
  opt110.addEventListener('change', updatePrice);
  optAPS.addEventListener('change', updatePrice);

  function updateTubeModel() {
    const len = parseInt(tubeLength.value);
    const mappedHeight = 40 + ((len - 50) / 150) * 120;
    tubeSegment.style.height = mappedHeight + 'px';
  }

  function updateAdapterModel() {
    const size = parseInt(adapterSize.value);
    const mappedWidth = 30 + ((size - 49) / 28) * 40;
    modelAdapter.style.width = mappedWidth + 'px';
  }

  function updatePrice() {
    if (!currentProduct) return;
    const prod = products[currentProduct];

    const isGlass = document.querySelector('.toggle-btn[data-value="glass"]').classList.contains('active');
    let price = isGlass ? prod.glassPrice : prod.basePrice;

    if (optScanTube.checked) {
      price += prod.tubePrice;
      // Longer tubes cost more
      const extraLength = Math.max(0, parseInt(tubeLength.value) - 100);
      price += Math.floor(extraLength / 10) * 1000;
    }

    if (optRoller.checked) price += prod.rollerPrice;
    if (prod.show110 && opt110.checked) price += prod.price110;
    if (prod.showAPS && optAPS.checked) price += prod.priceAPS;

    totalPrice.textContent = '₩' + price.toLocaleString();
  }

  // ---- Cart ----
  function openCart() {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('open');
  }

  function closeCart() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('open');
  }

  cartBtn.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  addToCartBtn.addEventListener('click', () => {
    if (!currentProduct) return;
    const prod = products[currentProduct];
    const isGlass = document.querySelector('.toggle-btn[data-value="glass"]').classList.contains('active');

    const item = {
      id: Date.now(),
      productKey: currentProduct,
      name: t(prod.nameKey),
      version: isGlass ? t('opt_glass') : t('opt_standard'),
      scanTube: optScanTube.checked,
      tubeLength: optScanTube.checked ? tubeLength.value + 'mm' : null,
      adapterSize: optScanTube.checked ? adapterSize.value + 'mm' : null,
      roller: optRoller.checked,
      film110: prod.show110 && opt110.checked,
      filmAPS: prod.showAPS && optAPS.checked,
      price: parseInt(totalPrice.textContent.replace(/[₩,]/g, '')),
    };

    cart.push(item);
    renderCart();
    showToast(t('toast_added'));
  });

  function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
    showToast(t('toast_removed'));
  }

  function renderCart() {
    cartCount.textContent = cart.length;

    if (cart.length === 0) {
      cartItems.innerHTML = '<p class="cart-empty">' + t('cart_empty') + '</p>';
      cartFooter.style.display = 'none';
      return;
    }

    cartFooter.style.display = 'block';
    let total = 0;
    let html = '';

    cart.forEach(item => {
      total += item.price;
      let details = item.version;
      if (item.scanTube) details += ' / ' + t('opt_scantube') + ' ' + item.tubeLength;
      if (item.roller) details += ' / ' + t('opt_roller');
      if (item.film110) details += ' / 110';
      if (item.filmAPS) details += ' / APS';

      html += `
        <div class="cart-item">
          <div class="cart-item-info">
            <h3>${item.name}</h3>
            <p>${details}</p>
          </div>
          <div class="cart-item-right">
            <span class="cart-item-price">₩${item.price.toLocaleString()}</span>
            <button class="cart-item-remove" data-id="${item.id}">${t('remove')}</button>
          </div>
        </div>
      `;
    });

    cartItems.innerHTML = html;
    cartTotal.textContent = '₩' + total.toLocaleString();

    // Bind remove buttons
    cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
    });
  }

  // ---- Checkout ----
  checkoutBtn.addEventListener('click', () => {
    closeCart();
    renderCheckoutSummary();
    showPage('checkout');
  });

  function renderCheckoutSummary() {
    let subtotal = 0;
    let html = '';

    cart.forEach(item => {
      subtotal += item.price;
      let details = item.version;
      if (item.scanTube) details += ' / ' + t('opt_scantube') + ' ' + item.tubeLength;
      if (item.roller) details += ' / ' + t('opt_roller');
      if (item.film110) details += ' / 110';
      if (item.filmAPS) details += ' / APS';

      html += `
        <div class="checkout-item">
          <div>
            <div class="checkout-item-name">${item.name}</div>
            <div class="checkout-item-details">${details}</div>
          </div>
          <div class="checkout-item-price">₩${item.price.toLocaleString()}</div>
        </div>
      `;
    });

    checkoutItems.innerHTML = html;
    checkoutSubtotal.textContent = '₩' + subtotal.toLocaleString();
    checkoutTotal.textContent = '₩' + (subtotal + SHIPPING_FEE).toLocaleString();
  }

  // ---- Daum Postcode ----
  zipSearchBtn.addEventListener('click', () => {
    new daum.Postcode({
      oncomplete: function (data) {
        custZip.value = data.zonecode;
        custAddress.value = data.roadAddress || data.jibunAddress;
        custDetailAddress.focus();
      }
    }).open();
  });

  // ---- Form Validation ----
  function validateCheckoutForm() {
    let valid = true;

    checkoutForm.querySelectorAll('input').forEach(input => input.classList.remove('invalid'));

    const requiredFields = [custName, custPhone, custEmail, custZip, custAddress, custDetailAddress];
    for (const field of requiredFields) {
      if (!field.value.trim()) {
        field.classList.add('invalid');
        valid = false;
      }
    }

    if (custPhone.value && !/^01[016789]-?\d{3,4}-?\d{4}$/.test(custPhone.value.trim())) {
      custPhone.classList.add('invalid');
      if (valid) showToast(t('checkout_invalid_phone'));
      valid = false;
    }

    if (custEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail.value.trim())) {
      custEmail.classList.add('invalid');
      if (valid) showToast(t('checkout_invalid_email'));
      valid = false;
    }

    if (valid === false && !custPhone.classList.contains('invalid') && !custEmail.classList.contains('invalid')) {
      showToast(t('checkout_required'));
    }

    return valid;
  }

  // ---- Order Submission ----
  function generateOrderId() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return 'AD-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  }

  submitOrderBtn.addEventListener('click', async () => {
    if (!validateCheckoutForm()) return;

    submitOrderBtn.disabled = true;
    submitOrderBtn.textContent = t('checkout_submitting');

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const total = subtotal + SHIPPING_FEE;
    const orderId = generateOrderId();

    const orderData = {
      orderId: orderId,
      name: custName.value.trim(),
      phone: custPhone.value.trim(),
      email: custEmail.value.trim(),
      zip: custZip.value.trim(),
      address: custAddress.value.trim(),
      detailAddress: custDetailAddress.value.trim(),
      items: cart.map(item => ({
        name: item.name,
        productKey: item.productKey,
        version: item.version,
        scanTube: item.scanTube,
        tubeLength: item.tubeLength,
        adapterSize: item.adapterSize,
        roller: item.roller,
        film110: item.film110,
        filmAPS: item.filmAPS,
        price: item.price,
      })),
      subtotal: subtotal,
      shipping: SHIPPING_FEE,
      total: total,
      lang: currentLang,
    };

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(orderData),
      });

      showConfirmation(orderId, total);
      cart = [];
      renderCart();
    } catch (err) {
      showToast(t('checkout_error'));
    } finally {
      submitOrderBtn.disabled = false;
      submitOrderBtn.textContent = t('checkout_submit');
    }
  });

  function showConfirmation(orderId, total) {
    document.querySelector('.checkout-layout').style.display = 'none';
    checkoutConfirmation.style.display = 'block';
    confirmOrderId.textContent = orderId;
    confirmAmount.textContent = '₩' + total.toLocaleString();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  confirmBackBtn.addEventListener('click', () => {
    document.querySelector('.checkout-layout').style.display = '';
    checkoutConfirmation.style.display = 'none';
    checkoutForm.reset();
    showPage('shop');
  });

  // ---- Toast ----
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ---- Language Toggle ----
  langToggle.addEventListener('click', (e) => {
    const target = e.target.closest('.lang-option');
    if (!target) return;
    setLanguage(target.dataset.lang);

    // Re-render product name if on product page
    if (currentProduct) {
      configProductName.textContent = t(products[currentProduct].nameKey);
    }

    // Re-render cart
    renderCart();
  });

  // ---- Scroll Reveal ----
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.product-row').forEach(row => {
      observer.observe(row);
    });
  }

  // ---- Init ----
  function init() {
    setLanguage('ko');
    initScrollReveal();

    // Handle hash navigation
    const hash = window.location.hash.replace('#', '');
    if (['shop', 'blog', 'about', 'contact'].includes(hash)) {
      showPage(hash);
    }
  }

  init();
})();
