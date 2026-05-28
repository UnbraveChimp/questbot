import type { Route } from "./+types/home";
import Auth from "./auth/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quest Dashboard" },
    { name: "description", content: "The official Dashboard for Quest Bot!" },
  ];
}

export default function Home() {
  return <Auth />;
}
