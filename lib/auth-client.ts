import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";
// import { polarClient } from "@polar-sh/better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3000",
  plugins: [polarClient()],
});

// export const { signIn, signUp, useSession } = createAuthClient();

// this where we used these to send  data from frontend side using
// better auth function , where we are using this  authCLient inbuilt functions
