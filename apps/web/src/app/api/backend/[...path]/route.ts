import { authServer } from "@/lib/auth/server";

/** Same-origin proxy for authenticated backend calls; see `createAuthServer` for what it forwards. */
const handle = authServer.handlers.proxy;

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
