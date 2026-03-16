"use client";

/* eslint-disable @next/next/no-img-element */

import { useTenantRuntime } from "@/components/tenant-runtime-provider";
import { getTenantRuntime } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type { MirrorLocale } from "@/lib/reverseclinic-types";

type ReverseCartContentProps = {
  locale: MirrorLocale;
  tenantId: TenantId;
  className?: string;
  onClose?: () => void;
  showSummary?: boolean;
};

export function ReverseCartContent({
  locale,
  tenantId,
  className,
  onClose,
  showSummary = true,
}: ReverseCartContentProps) {
  const { cart, clearCart, removeFromCart, updateQuantity } = useTenantRuntime();
  const messages = getTenantRuntime(tenantId).localeMessages[locale];
  const itemLabel = cart.itemCount === 1 ? "item" : "items";

  return (
    <section className={className ?? "reverse-cart-panel"}>
      {showSummary ? (
        <div className="reverse-cart-summary">
          <strong>
            {cart.itemCount} {itemLabel}
          </strong>
          <span>{messages.cartTitle}</span>
        </div>
      ) : null}

      {cart.items.length === 0 ? (
        <p className="reverse-empty-copy">{messages.cartEmpty}</p>
      ) : (
        <>
          <div className="reverse-cart-grid">
            {cart.items.map((item) => (
              <article key={item.id} className="reverse-cart-item">
                {item.imageSrc ? <img src={item.imageSrc} alt={item.title} /> : null}
                <div className="reverse-cart-item-copy">
                  <strong>{item.title}</strong>
                  <span>{item.priceLabel ?? "-"}</span>
                  <div className="reverse-cart-item-controls">
                    <label>
                      {messages.quantity}
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                      />
                    </label>
                    <button
                      type="button"
                      className="reverse-secondary-button"
                      onClick={() => removeFromCart(item.id)}
                    >
                      {messages.remove}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="reverse-cart-footer">
            <button type="button" className="reverse-secondary-button" onClick={clearCart}>
              {messages.clearCart}
            </button>
            {onClose ? (
              <button type="button" className="reverse-primary-button" onClick={onClose}>
                {messages.close}
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
