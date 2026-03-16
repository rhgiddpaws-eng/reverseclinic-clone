"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CircleUserRound,
  FileImage,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PanelsTopLeft,
  Settings2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminSessionUser } from "@/lib/reverseclinic-types";

type AdminShellProps = {
  children: ReactNode;
  user: AdminSessionUser;
};

type AdminNavLink = {
  label: string;
  href: string;
};

type AdminNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: AdminNavLink[];
};

type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

const adminNavSections: AdminNavSection[] = [
  {
    label: "운영",
    items: [
      {
        key: "dashboard",
        label: "대시보드",
        icon: LayoutDashboard,
        href: "/admin",
      },
      {
        key: "community",
        label: "커뮤니티",
        icon: PanelsTopLeft,
        children: [
          { label: "시술후기", href: "/admin/community/reviews" },
          { label: "전후사진", href: "/admin/community/before-after" },
          { label: "미디어 IN", href: "/admin/community/media-in" },
          { label: "공지사항", href: "/admin/community/notice" },
        ],
      },
      {
        key: "popup",
        label: "메인 팝업",
        icon: FileImage,
        href: "/admin/popup",
      },
    ],
  },
  {
    label: "고객",
    items: [
      {
        key: "submissions",
        label: "문의 관리",
        icon: MessageSquareText,
        children: [
          { label: "상담 문의", href: "/admin/submissions/consult" },
          { label: "예약 문의", href: "/admin/submissions/reservation" },
          { label: "차트/불만", href: "/admin/submissions/feedback" },
        ],
      },
      {
        key: "members",
        label: "회원 관리",
        icon: Users,
        href: "/admin/members",
      },
      {
        key: "settings",
        label: "관리자 설정",
        icon: Settings2,
        href: "/admin/settings/admin",
      },
    ],
  },
];

function matchesPath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const activeKeys = useMemo(() => {
    const keys = new Set<string>();

    adminNavSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.href && matchesPath(pathname, item.href)) {
          keys.add(item.key);
        }

        if (item.children?.some((child) => matchesPath(pathname, child.href))) {
          keys.add(item.key);
        }
      });
    });

    return keys;
  }, [pathname]);

  useEffect(() => {
    setOpenMap((current) => {
      const next = { ...current };
      activeKeys.forEach((key) => {
        next[key] = true;
      });
      return next;
    });
  }, [activeKeys]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 980) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="admin-layout" data-left-open={isSidebarOpen ? "open" : "closed"}>
      <aside className="adm--l">
        <div className="adm--l-top">
          <button
            type="button"
            className="adm--l-logo"
            onClick={() => setIsSidebarOpen((current) => !current)}
          >
            <img src="/admin-assets/login_logo.png" alt="Reverseclinic admin" />
            <div className="adm--l-logo-copy">
              <strong>Reverseclinic</strong>
              <span>Admin Console</span>
            </div>
          </button>
        </div>

        <div className="adm--l-body">
          {adminNavSections.map((section) => (
            <div key={section.label}>
              <div className="adm--l-list-tit">{section.label}</div>
              <div className="adm--l-list">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeKeys.has(item.key);
                  const isOpen = openMap[item.key] ?? isActive;

                  if (item.href) {
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        className={`adm--l-item link ${isActive ? "active" : "notActive"}`}
                      >
                        <div className="adm--l-tit adm--l-tit1">
                          <div className="adm--l-icon">
                            <div className="adm--l-icon-bg" />
                            <Icon size={18} strokeWidth={2} />
                          </div>
                          <div className="adm--l-tit-p">
                            <div className="adm--l-tit-icon-small">
                              <Icon size={16} strokeWidth={2} />
                            </div>
                            <p>{item.label}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={item.key}
                      className={`adm--l-item ${isOpen ? "" : "hide"} ${isActive ? "active" : "notActive"}`}
                    >
                      <button
                        type="button"
                        className="adm--l-tit adm--l-tit1 adm--l-trigger"
                        onClick={() => {
                          if (!isSidebarOpen) {
                            setIsSidebarOpen(true);
                          }

                          setOpenMap((current) => ({
                            ...current,
                            [item.key]: !isOpen,
                          }));
                        }}
                      >
                        <div className="adm--l-icon">
                          <div className="adm--l-icon-bg" />
                          <Icon size={18} strokeWidth={2} />
                        </div>
                        <div className="adm--l-tit-p">
                          <div className="adm--l-tit-icon-small">
                            <Icon size={16} strokeWidth={2} />
                          </div>
                          <p>{item.label}</p>
                        </div>
                        <div className="adm--l-tit1-arr" />
                      </button>

                      <div className="adm--l-list2">
                        {item.children?.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`adm--l-item2 link ${matchesPath(pathname, child.href) ? "sub_active" : "sub_notActive"}`}
                          >
                            <div className="adm--l-tit">
                              <div data-depth="3" className="adm--l-tit-p">
                                <p>{child.label}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div style={{ height: "100%" }} />
          <div className="l-footer">운영 데이터: data/reverseclinic-local.json</div>
        </div>
      </aside>

      <div className="adm--pg">
        <header className="adm--topbar">
          <div className="adm--topbar-l">
            <div className="adm--topbar-toggleLeftBar">
              <button
                type="button"
                className="btn adm--topbar-toggleLeftBar-btn"
                onClick={() => setIsSidebarOpen((current) => !current)}
              >
                <Menu size={18} />
              </button>
            </div>
            <div className="adm--topbar-logo">
              <img className="logo-light" src="/admin-assets/login_logo.png" alt="Reverseclinic" />
            </div>
          </div>

          <div className="adm--topbar-r">
            <div className="adm--topbar-user-box">
              <div className="adm--topbar-user-img">
                <CircleUserRound size={18} />
              </div>
              <div className="adm--topbar-user-txt">
                <div className="adm--topbar-user-name">{user.name}</div>
                <div className="adm--topbar-user-type">{user.loginId}</div>
              </div>
            </div>
            <button
              type="button"
              className="adm--topbar-logout btn"
              disabled={isLoggingOut}
              onClick={async () => {
                setIsLoggingOut(true);
                try {
                  await fetch("/api/admin/auth/logout", {
                    method: "POST",
                    credentials: "same-origin",
                  });
                } finally {
                  router.replace("/admin/login");
                  router.refresh();
                }
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="adm">
          {children}
          <footer className="adm--footer">
            <span>현재 관리자: {user.loginId}</span>
            <span>업로드 경로: public/uploads</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
