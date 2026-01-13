import { useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Fragment } from "react";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  customers: "Clientes",
  invoices: "Faturas",
  collection: "Cobrança",
  kanban: "Kanban",
  reconciliation: "Conciliação",
  import: "Importação",
  reports: "Relatórios",
  settings: "Configurações",
  users: "Usuários",
};

export function AppBreadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Don't show breadcrumb for root/dashboard
  if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === "dashboard")) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const buildPath = (index: number) => {
    return "/" + pathSegments.slice(0, index + 1).join("/");
  };

  const getLabel = (segment: string) => {
    return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const path = buildPath(index);

          // Skip 'dashboard' if it's already shown
          if (segment === "dashboard") return null;

          return (
            <Fragment key={path}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{getLabel(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={path}>{getLabel(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
