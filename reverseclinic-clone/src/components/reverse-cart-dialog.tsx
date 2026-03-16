"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect } from "react";
import { ReverseCartContent } from "@/components/reverse-cart-content";
import { useTenantRuntime } from "@/components/tenant-runtime-provider";
import { getTenantRuntime } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";
import type { MirrorLocale } from "@/lib/reverseclinic-types";

type ReverseCartDialogProps = {
  locale: MirrorLocale;
  tenantId: TenantId;
};

export function ReverseCartDialog({ locale, tenantId }: ReverseCartDialogProps) {
  const { cartDialog, closeCartDialog } = useTenantRuntime();
  const { localeMessages, mirrorAssets } = getTenantRuntime(tenantId);
  const messages = localeMessages[locale];

  useEffect(() => {
    if (!cartDialog.isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCartDialog();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [cartDialog.isOpen, closeCartDialog]);

  if (!cartDialog.isOpen) {
    return null;
  }

  return (
    <div
      className="reverse-cart-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeCartDialog();
        }
      }}
    >
      <div
        className="reverse-cart-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reverse-cart-title"
      >
        <button
          type="button"
          className="reverse-cart-close"
          aria-label={messages.close}
          onClick={closeCartDialog}
        >
          <img src={mirrorAssets.authCloseIcon} alt="" />
        </button>

        <div className="reverse-cart-modal-panel">
          <div className="reverse-cart-modal-header">
            <p className="reverse-page-eyebrow">CART</p>
            <h2 id="reverse-cart-title">{messages.cartTitle}</h2>
          </div>
          <ReverseCartContent
            locale={locale}
            tenantId={tenantId}
            className="reverse-cart-panel reverse-cart-panel--dialog"
            onClose={closeCartDialog}
          />
        </div>
      </div>
    </div>
  );
}
