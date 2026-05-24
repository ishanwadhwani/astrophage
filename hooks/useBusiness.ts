import { getUser } from "@/lib/auth";

export const useBusiness = () => {
  const user = getUser();
  return {
    user,
    businessId: user?.business?.id || null,
  };
};
