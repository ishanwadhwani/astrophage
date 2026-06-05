// import { useMemo } from "react";
// import { can, Permission } from "@/lib/permissions";

// export function usePermission(...permissions: Permission[]): boolean {
//   return useMemo(
//     () => permissions.every((p) => can(p)),
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     [permissions.join(",")]
//   );
// }

import { can, Permission } from "@/lib/permissions";

export function usePermission(...permissions: Permission[]): boolean {
  return permissions.every((p) => can(p));
}
