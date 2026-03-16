import type { MirrorLocale } from "@/lib/reverseclinic-types";

export type LocaleUiMessages = {
  bestTitle: string;
  cartTitle: string;
  cartEmpty: string;
  cartAction: string;
  talkTitle: string;
  talkSubtitle: string;
  reservationTitle: string;
  quickConsult: string;
  quickReservation: string;
  submit: string;
  clearCart: string;
  quantity: string;
  remove: string;
  addedToCart: string;
  loginTitle: string;
  joinTitle: string;
  close: string;
  localeLabel: string;
  requestFailed: string;
  networkError: string;
  allMenuLabel: string;
  networkLabel: string;
  backToTopLabel: string;
  businessNameLabel: string;
  addressLabel: string;
  ownerLabel: string;
  businessNumberLabel: string;
  quickKakaoTalk: string;
  reviewTitle: string;
  beforeAfterTitle: string;
  eventTitle: string;
  directionsTitle: string;
  authLoginPrompt: string;
  authJoinPrompt: string;
  authLoginFailed: string;
  authJoinFailed: string;
  authProcessing: string;
  authLoginIdLabel: string;
  authPasswordLabel: string;
  authNameLabel: string;
  authPhoneLabel: string;
  authEmailLabel: string;
  authLoggedInAs: string;
  authSupportNote: string;
  authMissingCredentials: string;
  authInvalidCredentials: string;
  authMemberNotFound: string;
  authJoinMissingFields: string;
  authPasswordMinLength: string;
  authInvalidEmail: string;
  authDuplicateUser: string;
  authJoinServerError: string;
  communityLoginRequiredReason: string;
  communityLoginRequiredDetail: string;
  adminTitle: string;
};

export const localeOrder: MirrorLocale[] = ["ko", "en", "jp", "cn"];

export const localeLabels: Record<MirrorLocale, string> = {
  ko: "KR",
  en: "EN",
  jp: "JP",
  cn: "CN",
};

export function getLocalePrefix(locale: MirrorLocale) {
  // 기본 언어(ko)는 루트(`/`)를 유지하고 나머지는 접두어를 붙인다.
  return locale === "ko" ? "" : `/${locale}`;
}
