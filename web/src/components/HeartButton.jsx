import { IconButton } from "@kasumi/ui";
import { Heart } from "lucide-react";
import { COPY } from "@/copy.js";
import { useSaved } from "@/lib/saved.jsx";

function FilledHeart(props) {
  return <Heart {...props} fill="currentColor" />;
}

function ImageHeart(props) {
  return <Heart {...props} fill="rgb(0 0 0 / 0.45)" />;
}

export function HeartButton({ kind, id, title, className = "", onImage = true }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(kind, id);
  return (
    <IconButton
      icon={saved ? FilledHeart : onImage ? ImageHeart : Heart}
      label={saved ? COPY.WISHLIST.REMOVE(title) : COPY.WISHLIST.ADD(title)}
      pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        toggle(kind, id);
      }}
      className={`${onImage ? "text-white drop-shadow hover:bg-transparent [&_svg]:h-6 [&_svg]:w-6 [&_svg]:stroke-[2.2]" : ""} ${saved ? "!text-[#e0475f]" : ""} ${className}`}
    />
  );
}
