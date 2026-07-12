import { headers } from "next/headers";
import { prisma } from "./prisma";

export async function getTenantFromHeaders() {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  const slug = extractTenantSlug(host);
  return slug;
}

export function extractTenantSlug(host: string): string {
  const parts = host.split(".");

  if (parts.length >= 3 && parts[0] !== "www") {
    return parts[0];
  }

  return process.env.NEXT_PUBLIC_DEFAULT_TENANT ?? "demo";
}

export async function getTenantBySlug(slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}

export async function requireTenant(slug: string) {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) throw new Error("Organization not found");
  return tenant;
}
