import { Input } from '~/components/input/input';
import { Button } from '~/components/button/button';
import { Dropdown } from '~/components/dropdown/dropdown';
export function meta() {
  return [
    { title: "Dashboard | QuestBot" },
    { name: "description", content: "QuestBot Dashboard" },
  ];
}

export default function Auth() {
  return (
    <main className="flex min-h-screen items-center gap-4 justify-center bg-white">
        <Dropdown width="250px">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
        </Dropdown>
        <Input width="250px" placeholder="wow" />
        <Button variant="1">1</Button>
        <Button variant="2">2</Button>
    </main>
  );
}