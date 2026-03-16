import type { CSSProperties } from "react";
import { getTenantConfig } from "@/lib/tenant-registry";
import type { TenantId } from "@/lib/tenant-types";

export function getTenantBodyStyle(tenantId: TenantId): CSSProperties {
  const theme = getTenantConfig(tenantId).theme;

  return {
    "--reverse-text": theme.textColor,
    "--reverse-muted": theme.mutedColor,
    "--reverse-light": theme.lightColor,
    "--reverse-border": theme.borderColor,
    "--reverse-soft-border": theme.softBorderColor,
    "--reverse-background": theme.backgroundColor,
    "--reverse-pink": theme.accentColor,
    "--reverse-hero-arrow-image": `url("${theme.heroArrowImage}")`,
    "--reverse-info-banner-image": `url("${theme.infoBannerImage}")`,
    "--reverse-footer-arrow-image": `url("${theme.footerArrowImage}")`,
    "--reverse-footer-sns-image": `url("${theme.footerSnsImage}")`,
    "--reverse-footer-sns-hover-image": `url("${theme.footerSnsHoverImage}")`,
  } as CSSProperties;
}
