import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import type { USER } from "@/lib/types";

type MemberAvatarProps = {
  user: USER;
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
};

export default function MemberAvatar({
  user,
  size = "sm",
  className,
}: MemberAvatarProps) {
  return (
    <Avatar
      className={cn(
        "border-2 border-white bg-[#dfe1e6] text-[#172b4d]",
        sizeClasses[size],
        className,
      )}
      title={user.name}
    >
      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.name} /> : null}
      <AvatarFallback className="bg-[#dfe1e6] font-semibold text-[#172b4d]">
        {getInitials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
