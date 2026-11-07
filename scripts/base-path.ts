export function basePath(): string {
  const raw = process.env.BASE_PATH || "/";
  const withLead = raw.startsWith("/") ? raw : `/${raw}`;
  return withLead.endsWith("/") ? withLead : `${withLead}/`;
}
