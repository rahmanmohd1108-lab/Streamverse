import { withErrorHandler, apiSuccess, apiError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async () => {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHORIZED", "Authentication required");
  }
  return apiSuccess({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      status: user.status,
    },
  });
});
