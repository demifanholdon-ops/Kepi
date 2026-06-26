import Image from "next/image";
import { cn } from "@/lib/utils";

type GameIconProps = {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
};

export function GameIcon({
  src,
  alt = "",
  size = 24,
  className,
}: GameIconProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("block shrink-0 object-contain drop-shadow-sm", className)}
      draggable={false}
    />
  );
}
