/**
 * Noor Trading Corporation - Cart state module
 * Cart lives in localStorage as an array of { productId, quantity }.
 * No customer login is required - the cart is tied to this browser only.
 */
(function (global) {
  const STORAGE_KEY = 'ntc_cart_v1';

  function readRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (it) => it && Number.isInteger(it.productId) && Number.isInteger(it.quantity) && it.quantity > 0
      );
    } catch (err) {
      console.warn('Failed to read cart from storage', err);
      return [];
    }
  }

  function writeRaw(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save cart to storage', err);
    }
    global.dispatchEvent(new CustomEvent('ntc:cart-updated', { detail: { items } }));
  }

  function getCart() {
    return readRaw();
  }

  function getItemCount() {
    return readRaw().reduce((sum, it) => sum + it.quantity, 0);
  }

  function addItem(productId, quantity = 1) {
    const id = Number(productId);
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    const items = readRaw();
    const existing = items.find((it) => it.productId === id);
    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({ productId: id, quantity: qty });
    }
    writeRaw(items);
    return items;
  }

  function setItemQuantity(productId, quantity) {
    const id = Number(productId);
    const qty = Math.floor(Number(quantity) || 0);
    let items = readRaw();
    if (qty <= 0) {
      items = items.filter((it) => it.productId !== id);
    } else {
      const existing = items.find((it) => it.productId === id);
      if (existing) {
        existing.quantity = qty;
      } else {
        items.push({ productId: id, quantity: qty });
      }
    }
    writeRaw(items);
    return items;
  }

  function removeItem(productId) {
    const id = Number(productId);
    const items = readRaw().filter((it) => it.productId !== id);
    writeRaw(items);
    return items;
  }

  function clearCart() {
    writeRaw([]);
  }

  global.NTCCart = {
    getCart,
    getItemCount,
    addItem,
    setItemQuantity,
    removeItem,
    clearCart,
  };
})(window);
