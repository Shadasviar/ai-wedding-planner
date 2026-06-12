import { auth } from "@root/auth"

export default auth(() => {
  // Auth.js v5 proxy middleware
  // The session is automatically available
})

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
}
