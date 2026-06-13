import { useState } from "react";
import useLists from "@/hooks/apis/use-lists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AddListButtonProps = {
  boardId: string;
};

export default function AddListButton({ boardId }: AddListButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const { useCreateList } = useLists(boardId);
  const { mutateAsync: createList, isPending } = useCreateList();

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    await createList({ boardId, title: trimmed });
    setTitle("");
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="h-fit w-[272px] shrink-0 rounded-xl bg-[#ffffff3d] px-3 py-2 text-left text-sm font-medium text-white hover:bg-[#ffffff52]"
      >
        + Add another list
      </button>
    );
  }

  return (
    <div className="w-[272px] shrink-0 rounded-xl bg-[#ebecf0] p-2">
      <Input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Enter list title..."
        className="border-[#388bff] bg-white text-sm shadow-none"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            void handleCreate();
          }
          if (event.key === "Escape") {
            setIsAdding(false);
            setTitle("");
          }
        }}
      />
      <div className="mt-2 flex items-center gap-2">
        <Button
          size="sm"
          className="bg-[#0079bf] hover:bg-[#026aa7]"
          disabled={isPending || !title.trim()}
          onClick={() => void handleCreate()}
        >
          Add list
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setIsAdding(false);
            setTitle("");
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
