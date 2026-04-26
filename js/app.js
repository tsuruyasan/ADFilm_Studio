// ================================================
// AD filmstudio — Main Application
// ================================================

(function () {
  'use strict';

  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3b4Alx8jkqWjDU5detTwQpRNMr_zJio2AhR3sM-vNBrFuZYL4UOAACedOl9vciO9A/exec';
  const SHIPPING_FEE = 4000;
  const ORDER_TOKEN = 'adf1lm_2026_s3cure_t0ken';

  // ---- Helper: calculate price from config (not from DOM) ----
  function calculateItemPrice(productKey, options) {
    const prod = products[productKey];
    if (!prod) return 0;
    let price = options.isGlass ? prod.glassPrice : prod.basePrice;
    if (options.scanTube) {
      price += prod.tubePrice;
      const tubeVal = parseInt(options.tubeLengthVal) || 100;
      const extraLength = Math.max(0, tubeVal - 100);
      price += Math.floor(extraLength / 10) * 1000;
    }
    if (options.roller) price += prod.rollerPrice;
    if (prod.show110 && options.film110) price += (prod.price110 || 0);
    if (prod.showAPS && options.filmAPS) price += (prod.priceAPS || 0);
    return price;
  }

  // ---- Helper: safe text element creation ----
  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // ---- Product Data ----
  const products = {
    small: {
      nameKey: 'product_small_name',
      format: '110 + APS + 35mm',
      basePrice: 45000,
      glassPrice: 65000,
      tubePrice: 15000,
      rollerPrice: 8000,
      show110: false,
      showAPS: false,
    },
    medium: {
      nameKey: 'product_medium_name',
      format: '120mm / 6x45~69',
      basePrice: 55000,
      glassPrice: 78000,
      tubePrice: 18000,
      rollerPrice: 10000,
      show110: false,
      showAPS: false,
    },
    multi: {
      nameKey: 'product_multi_name',
      format: '110 + APS + 35mm + 120mm',
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

    const options = {
      isGlass: isGlass,
      scanTube: optScanTube.checked,
      tubeLengthVal: tubeLength.value,
      roller: optRoller.checked,
      film110: prod.show110 && opt110.checked,
      filmAPS: prod.showAPS && optAPS.checked,
    };

    const item = {
      id: Date.now(),
      productKey: currentProduct,
      name: t(prod.nameKey),
      version: isGlass ? t('opt_glass') : t('opt_standard'),
      scanTube: options.scanTube,
      tubeLength: options.scanTube ? tubeLength.value + 'mm' : null,
      tubeLengthVal: options.scanTube ? parseInt(tubeLength.value) : null,
      adapterSize: options.scanTube ? adapterSize.value + 'mm' : null,
      roller: options.roller,
      film110: options.film110,
      filmAPS: options.filmAPS,
      price: calculateItemPrice(currentProduct, options),
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

  function getItemDetails(item) {
    let details = item.version;
    if (item.scanTube) details += ' / ' + t('opt_scantube') + ' ' + item.tubeLength;
    if (item.roller) details += ' / ' + t('opt_roller');
    if (item.film110) details += ' / 110';
    if (item.filmAPS) details += ' / APS';
    return details;
  }

  function renderCart() {
    cartCount.textContent = cart.length;
    cartItems.textContent = '';

    if (cart.length === 0) {
      cartItems.appendChild(el('p', 'cart-empty', t('cart_empty')));
      cartFooter.style.display = 'none';
      return;
    }

    cartFooter.style.display = 'block';
    let total = 0;

    cart.forEach(item => {
      total += item.price;

      const row = el('div', 'cart-item');
      const info = el('div', 'cart-item-info');
      info.appendChild(el('h3', null, item.name));
      info.appendChild(el('p', null, getItemDetails(item)));
      row.appendChild(info);

      const right = el('div', 'cart-item-right');
      right.appendChild(el('span', 'cart-item-price', '₩' + item.price.toLocaleString()));
      const removeBtn = el('button', 'cart-item-remove', t('remove'));
      removeBtn.addEventListener('click', () => removeFromCart(item.id));
      right.appendChild(removeBtn);
      row.appendChild(right);

      cartItems.appendChild(row);
    });

    cartTotal.textContent = '₩' + total.toLocaleString();
  }

  // ---- Checkout ----
  checkoutBtn.addEventListener('click', () => {
    closeCart();
    renderCheckoutSummary();
    showPage('checkout');
  });

  function renderCheckoutSummary() {
    checkoutItems.textContent = '';
    let subtotal = 0;

    cart.forEach(item => {
      subtotal += item.price;

      const row = el('div', 'checkout-item');
      const left = document.createElement('div');
      left.appendChild(el('div', 'checkout-item-name', item.name));
      left.appendChild(el('div', 'checkout-item-details', getItemDetails(item)));
      row.appendChild(left);
      row.appendChild(el('div', 'checkout-item-price', '₩' + item.price.toLocaleString()));

      checkoutItems.appendChild(row);
    });

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

    // Client-side total for display only — server recalculates from product config
    const displaySubtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const displayTotal = displaySubtotal + SHIPPING_FEE;
    const orderId = generateOrderId();

    const orderData = {
      token: ORDER_TOKEN,
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
        isGlass: item.version === t('opt_glass'),
        scanTube: item.scanTube,
        tubeLength: item.tubeLength,
        tubeLengthVal: item.tubeLengthVal,
        adapterSize: item.adapterSize,
        roller: item.roller,
        film110: item.film110,
        filmAPS: item.filmAPS,
      })),
      lang: currentLang,
    };

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(orderData),
      });

      // Google Apps Script returns an opaque redirect — if fetch didn't throw, the request was sent
      showConfirmation(orderId, displayTotal);
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
