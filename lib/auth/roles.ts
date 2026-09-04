export type AppRole = "owner" | "admin" | "manager" | "coordinator" | "cashier" | "waiter";

export type Permission =
  | "sell"
  | "manage_tables"
  | "manage_customers"
  | "manage_debts"
  | "manage_inventory"
  | "manage_expenses"
  | "manage_events"
  | "view_reports"
  | "manage_staff"
  | "manage_settings"
  | "void_sale";

const permissions: Record<AppRole, ReadonlySet<Permission>> = {
  owner: new Set([
    "sell","manage_tables","manage_customers","manage_debts","manage_inventory",
    "manage_expenses","manage_events","view_reports","manage_staff","manage_settings","void_sale"
  ]),
  admin: new Set([
    "sell","manage_tables","manage_customers","manage_debts","manage_inventory",
    "manage_expenses","manage_events","view_reports","manage_staff","manage_settings","void_sale"
  ]),
  manager: new Set([
    "sell","manage_tables","manage_customers","manage_debts","manage_inventory",
    "manage_expenses","manage_events","view_reports","void_sale"
  ]),
  coordinator: new Set([
    "sell","manage_tables","manage_customers","manage_events","view_reports"
  ]),
  cashier: new Set([
    "sell","manage_tables","manage_customers","manage_debts","view_reports"
  ]),
  waiter: new Set([
    "sell","manage_tables","manage_customers"
  ])
};

export function hasPermission(role: AppRole, permission: Permission): boolean {
  return permissions[role].has(permission);
}
