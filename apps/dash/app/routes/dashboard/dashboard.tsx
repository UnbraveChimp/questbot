import { Input } from '~/components/input/input';
import { Button } from '~/components/button/button';
export function meta() {
  return [
    { title: "Dashboard | QuestBot" },
    { name: "description", content: "QuestBot Dashboard" },
  ];
}

export default function Auth() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
        <Input width="250px" placeholder="wow" />
        <Button variant="1">1</Button>
        <Button variant="2">2</Button>
    </main>
  );
}