document.addEventListener('DOMContentLoaded', function () {
    let products = [];
    const cart = [];
    const productsBlock = document.querySelector('.products-grid');
    const cartButton = document.querySelector('.cart-button');
    const cartCount = document.querySelector('.cart-count');
    const cartModal = document.querySelector('.cart-modal');
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total');
    const cartEmptyMessage = document.querySelector('.cart-empty');
    const cartCloseButton = document.querySelector('.cart-close');
    const checkoutForm = document.querySelector('.checkout-form');
    const checkoutPhone = document.querySelector('#checkout-phone');
    const checkoutConfirmation = document.querySelector('.checkout-confirmation');

    const currencyFormatter = new Intl.NumberFormat('uk-UA', {
        style: 'currency',
        currency: 'UAH',
        maximumFractionDigits: 0
    });

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[character];
        });
    }

    async function fetchProducts() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`Не вдалося завантажити товари: ${response.status}`);
            }

            products = await response.json();
            displayProducts(products);
        } catch (error) {
            console.error('Помилка завантаження товарів:', error);
            productsBlock.innerHTML = '<p class="products-error">Не вдалося завантажити товари. Спробуйте оновити сторінку.</p>';
        }
    }

    function displayProducts(items) {
        productsBlock.innerHTML = items.map(createProductCard).join('');
    }

    function createProductCard(product) {
        return `
            <div class="product-card">
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" class="product-image-box">
                <h3 class="product-name">${escapeHtml(product.title)}</h3>
                <p class="product-meta">Виробник: ${escapeHtml(product.maker)}</p>
                <p class="product-meta">Гарантія: ${escapeHtml(product.guarantee)} роки</p>
                <p class="product-meta">Наявність: ${product.availability ? 'В наявності' : 'Немає в наявності'}</p>
                <p class="product-desc">${escapeHtml(product.description)}</p>
                <h4 class="product-price">${currencyFormatter.format(product.price)}</h4>
                <button class="add-to-cart-btn" data-id="${escapeHtml(product.id)}" ${product.availability ? '' : 'disabled'}>
                    ${product.availability ? 'Додати до кошика' : 'Немає в наявності'}
                </button>
            </div>
        `;
    }

    function renderCart() {
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalQuantity;
        cartCount.hidden = totalQuantity === 0;
        cartEmptyMessage.hidden = cart.length > 0;
        checkoutForm.hidden = cart.length === 0;
        cartItems.innerHTML = cart.map(({ product, quantity }) => `
            <article class="cart-item">
                <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${escapeHtml(product.title)}</h3>
                    <p class="cart-item-price">${currencyFormatter.format(product.price)} за шт.</p>
                    <div class="cart-item-controls" aria-label="Кількість товару ${escapeHtml(product.title)}">
                        <button class="quantity-btn" type="button" data-action="decrease" data-id="${escapeHtml(product.id)}" aria-label="Зменшити кількість">−</button>
                        <span class="cart-item-quantity">${quantity}</span>
                        <button class="quantity-btn" type="button" data-action="increase" data-id="${escapeHtml(product.id)}" aria-label="Збільшити кількість">+</button>
                    </div>
                </div>
                <div class="cart-item-end">
                    <strong>${currencyFormatter.format(product.price * quantity)}</strong>
                    <button class="remove-from-cart-btn" type="button" data-action="remove" data-id="${escapeHtml(product.id)}">Видалити</button>
                </div>
            </article>
        `).join('');

        const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        cartTotal.textContent = currencyFormatter.format(total);
    }

    function openCart() {
        cartModal.hidden = false;
        document.body.classList.add('cart-open');
        cartCloseButton.focus();
    }

    function closeCart() {
        cartModal.hidden = true;
        document.body.classList.remove('cart-open');
        cartButton.focus();
    }

    productsBlock.addEventListener('click', function (event) {
        const button = event.target.closest('.add-to-cart-btn');
        if (!button || button.disabled) {
            return;
        }

        const product = products.find(item => String(item.id) === button.dataset.id);
        if (!product) {
            return;
        }

        const cartItem = cart.find(item => String(item.product.id) === button.dataset.id);
        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cart.push({ product, quantity: 1 });
        }

        checkoutConfirmation.hidden = true;
        renderCart();
    });

    cartItems.addEventListener('click', function (event) {
        const button = event.target.closest('[data-action]');
        if (!button) {
            return;
        }

        const itemIndex = cart.findIndex(item => String(item.product.id) === button.dataset.id);
        if (itemIndex === -1) {
            return;
        }

        if (button.dataset.action === 'remove') {
            cart.splice(itemIndex, 1);
        } else if (button.dataset.action === 'increase') {
            cart[itemIndex].quantity += 1;
        } else if (button.dataset.action === 'decrease') {
            cart[itemIndex].quantity -= 1;
            if (cart[itemIndex].quantity === 0) {
                cart.splice(itemIndex, 1);
            }
        }

        renderCart();
    });

    checkoutPhone.addEventListener('input', function () {
        checkoutPhone.setCustomValidity('');
    });

    checkoutForm.addEventListener('submit', function (event) {
        event.preventDefault();

        if (cart.length === 0) {
            return;
        }

        const phone = checkoutPhone.value.trim();
        const digits = phone.replace(/\D/g, '');
        const hasValidCharacters = /^[+\d\s()-]+$/.test(phone);
        const isUkrainianPhone = (digits.length === 10 && digits.startsWith('0'))
            || (digits.length === 12 && digits.startsWith('380'));

        checkoutPhone.setCustomValidity(
            hasValidCharacters && isUkrainianPhone
                ? ''
                : 'Введіть коректний український номер: 0XXXXXXXXX або +380XXXXXXXXX.'
        );

        if (!checkoutForm.reportValidity()) {
            return;
        }

        cart.length = 0;
        checkoutForm.reset();
        checkoutConfirmation.textContent = 'Дякуємо! Замовлення оформлено. Очікуйте на дзвінок за вказаним номером.';
        checkoutConfirmation.hidden = false;
        renderCart();
    });

    cartButton.addEventListener('click', openCart);
    cartCloseButton.addEventListener('click', closeCart);
    cartModal.addEventListener('click', function (event) {
        if (event.target === cartModal) {
            closeCart();
        }
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !cartModal.hidden) {
            closeCart();
        }
    });

    renderCart();
    fetchProducts();
});
