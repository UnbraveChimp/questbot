import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("dashboard", "routes/dashboard/dashboard.tsx"),
    route("api/auth/*", "routes/auth/api.auth.$.ts"),
] satisfies RouteConfig;
