const reverseclinicSites = [
  { siteId: "gn-ko", origin: "https://reverseclinic.com", canonicalHost: "reverseclinic.com" },
  { siteId: "hd-ko", origin: "https://hd.reverseclinic.com", canonicalHost: "hd.reverseclinic.com" },
  { siteId: "md-ko", origin: "https://md.reverseclinic.com", canonicalHost: "md.reverseclinic.com" },
  { siteId: "ic-ko", origin: "https://ic.reverseclinic.com", canonicalHost: "ic.reverseclinic.com" },
  { siteId: "sw-ko", origin: "https://sw.reverseclinic.com", canonicalHost: "sw.reverseclinic.com" },
  { siteId: "nw-ko", origin: "https://nw.reverseclinic.com", canonicalHost: "nw.reverseclinic.com" },
  { siteId: "is-ko", origin: "https://is.reverseclinic.com", canonicalHost: "is.reverseclinic.com" },
  { siteId: "bd-ko", origin: "https://bd.reverseclinic.com", canonicalHost: "bd.reverseclinic.com" },
  { siteId: "gn-en", origin: "https://gn-en.reverseclinic.com", canonicalHost: "gn-en.reverseclinic.com" },
  { siteId: "gn-jp", origin: "https://gn-jp.reverseclinic.com", canonicalHost: "gn-jp.reverseclinic.com" },
  { siteId: "gn-cn", origin: "https://gn-cn.reverseclinic.com", canonicalHost: "gn-cn.reverseclinic.com" },
  { siteId: "hd-en", origin: "https://hd-en.reverseclinic.com", canonicalHost: "hd-en.reverseclinic.com" },
  { siteId: "hd-jp", origin: "https://hd-jp.reverseclinic.com", canonicalHost: "hd-jp.reverseclinic.com" },
  { siteId: "hd-cn", origin: "https://hd-cn.reverseclinic.com", canonicalHost: "hd-cn.reverseclinic.com" },
  { siteId: "md-en", origin: "https://md-en.reverseclinic.com", canonicalHost: "md-en.reverseclinic.com" },
  { siteId: "md-jp", origin: "https://md-jp.reverseclinic.com", canonicalHost: "md-jp.reverseclinic.com" },
  { siteId: "md-cn", origin: "https://md-cn.reverseclinic.com", canonicalHost: "md-cn.reverseclinic.com" },
];

export const mirrorTenants = {
  reverseclinic: {
    tenantId: "reverseclinic",
    publicRootDir: "reverseclinic-mirror",
    manifestPath: "src/generated/reverse-mirror-pages.json",
    commonExtraPagePaths: [
      "/?_simpleApps=member/terms-of-use",
      "/?_simpleApps=member/privacy-policy",
      "/?_simpleApps=member/patients-rights",
      "/?_simpleApps=member/login",
      "/?_simpleApps=member/join",
    ],
    sites: reverseclinicSites.map((site) => ({
      ...site,
      manifestPath: `src/generated/reverse-mirror-pages.${site.siteId}.json`,
      blockedLanguageHosts: [],
      extraPageUrls:
        site.siteId.endsWith("-en") || site.siteId.endsWith("-jp") || site.siteId.endsWith("-cn")
          ? [`${site.origin}/?idx=c691fbb3286041`]
          : [],
    })),
  },
  wishlab: {
    tenantId: "wishlab",
    origin: "https://wishlab.example",
    canonicalHost: "wishlab.example",
    publicRootDir: "wishlab-mirror",
    manifestPath: "src/generated/wishlab-mirror-pages.json",
    blockedLanguageHosts: [],
    extraPageUrls: [],
  },
};

export function getMirrorTenant(tenantId) {
  return mirrorTenants[tenantId] ?? null;
}
