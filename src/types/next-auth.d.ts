import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    username: string
    role: string
    tenantId: string
  }
  interface Session {
    user: {
      id: string
      name?: string
      username?: string
      role?: string
      tenantId?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    tenantId: string
  }
}
