import { createAuthClient } from "better-auth/react";
import { jwtClient, phoneNumberClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [jwtClient(), phoneNumberClient()],
});
