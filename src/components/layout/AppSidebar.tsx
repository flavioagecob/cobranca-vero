import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Phone, 
  GitCompare, 
  Upload, 
  BarChart3,
  Settings,
  ChevronDown,
  Building2
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: ('admin' | 'supervisor' | 'cobrador')[];
  children?: { title: string; url: string }[];
};

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ['admin', 'supervisor', 'cobrador'],
  },
  {
    title: "Clientes",
    url: "/customers",
    icon: Users,
    roles: ['admin', 'supervisor', 'cobrador'],
  },
  {
    title: "Faturas",
    url: "/invoices",
    icon: FileText,
    roles: ['admin', 'supervisor', 'cobrador'],
  },
  {
    title: "Cobrança",
    url: "/collection",
    icon: Phone,
    roles: ['admin', 'supervisor', 'cobrador'],
    children: [
      { title: "Workstation", url: "/collection" },
      { title: "Kanban", url: "/collection/kanban" },
    ],
  },
  {
    title: "Conciliação",
    url: "/reconciliation",
    icon: GitCompare,
    roles: ['admin', 'supervisor'],
  },
];

const managementNavItems: NavItem[] = [
  {
    title: "Importação",
    url: "/import",
    icon: Upload,
    roles: ['admin'],
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    roles: ['admin', 'supervisor'],
  },
  {
    title: "Configurações",
    url: "/settings",
    icon: Settings,
    roles: ['admin'],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile, role } = useAuth();
  const collapsed = state === "collapsed";

  const hasAccess = (item: NavItem) => {
    if (!role) return false;
    return item.roles.includes(role);
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'cobrador': return 'Cobrador';
      default: return 'Sem função';
    }
  };

  const filteredMainItems = mainNavItems.filter(hasAccess);
  const filteredManagementItems = managementNavItems.filter(hasAccess);

  const renderMenuItem = (item: NavItem) => {
    if (item.children && item.children.length > 0) {
      return (
        <Collapsible key={item.title} defaultOpen className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                )}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenu className="ml-6 mt-1 border-l border-sidebar-border pl-2">
                {item.children.map((child) => (
                  <SidebarMenuItem key={child.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={child.url}
                        end
                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        {child.title}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/dashboard"}
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
          >
            <item.icon className="h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                CRM Cobrança
              </span>
              <span className="text-xs text-sidebar-foreground/70">Telecom</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredManagementItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredManagementItems.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.full_name || "Usuário"}
              </span>
              <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0">
                {getRoleLabel(role)}
              </Badge>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
