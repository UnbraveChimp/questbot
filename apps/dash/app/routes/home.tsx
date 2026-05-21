import type { Route } from "./+types/home";
import Auth from "./auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Quest Dashboard" },
    { name: "description", content: "The official Dashboard for the Quest Discord Bot!" },
  ];
}

export default function Home() {
  return <Auth />;
}
