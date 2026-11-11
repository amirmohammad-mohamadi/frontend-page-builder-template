"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@components";
import type { NavItem } from "@/config/navigation";
import { useAccess } from "@/hooks/use-access";

const isActivePath = (pathname: string, url: string) =>
  url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(`${url}/`);

/** A sidebar group. Entries the operator may not open (`ROUTE_PERMISSIONS`) are left out. */
export function NavMain({ label, items }: { label?: string; items: NavItem[] }) {
  const pathname = usePathname();
  const { checkRoute } = useAccess();
  const visible = items.filter((item) => checkRoute(item.url) !== "denied");

  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {visible.map((item) =>
          item.items?.length ? (
            <Collapsible
              key={item.url}
              asChild
              defaultOpen={isActivePath(pathname, item.url)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon ? <item.icon /> : null}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180 rtl:group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((sub) => (
                      <SidebarMenuSubItem key={sub.url}>
                        <SidebarMenuSubButton asChild isActive={isActivePath(pathname, sub.url)}>
                          <Link href={sub.url}>
                            <span>{sub.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActivePath(pathname, item.url)}
              >
                <Link href={item.url}>
                  {item.icon ? <item.icon /> : null}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
