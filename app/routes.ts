import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  route("login", "routes/login.tsx"),
  route("permohonan", "routes/permohonan-list.tsx"),
  route("permohonan/:id", "routes/permohonan-detail.tsx"),
  route("permohonan/:id/assessment", "routes/permohonan-assessment.tsx"),
  route("permohonan/:id/penyaluran", "routes/permohonan-penyaluran.tsx"),
  route("permohonan/:id/riwayat", "routes/permohonan-riwayat.tsx"),
  route("mustahik", "routes/mustahik-list.tsx"),
  route("mustahik/:id", "routes/mustahik-detail.tsx"),
] satisfies RouteConfig;
