import { useState } from "react";
import { Button, Modal } from "@kasumi/ui";
import { LayoutGrid } from "lucide-react";
import { COPY } from "@/copy.js";
import { photoUrl } from "@/lib/format.js";

function PhotoTour({ open, onClose, rooms }) {
  const groups = [...new Set(rooms.map((r) => r.room || COPY.LISTING.ALL_PHOTOS))].map((room) => ({ room, files: rooms.filter((r) => (r.room || COPY.LISTING.ALL_PHOTOS) === room).map((r) => r.file) }));
  const slug = (room) => `tour-${room.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <Modal open={open} onClose={onClose} title={COPY.LISTING.PHOTO_TOUR} size="xl">
      <nav className="mb-8 grid grid-cols-3 gap-4 sm:grid-cols-5" aria-label={COPY.LISTING.PHOTO_TOUR}>
        {groups.map((g) => (
          <a key={g.room} href={`#${slug(g.room)}`} className="rounded-card focus-ring">
            <img src={photoUrl(g.files[0])} alt="" className="aspect-[4/3] w-full rounded-card object-cover" />
            <span className="mt-1 block text-label text-fg">{g.room}</span>
          </a>
        ))}
      </nav>
      <div className="space-y-12">
        {groups.map((g) => (
          <section key={g.room} id={slug(g.room)} className="grid gap-4 md:grid-cols-[12rem_1fr]">
            <h3 className="text-title text-fg">{g.room}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {g.files.map((f, i) => (
                <img key={f} src={photoUrl(f)} alt={`${g.room}, ${COPY.CARD.PHOTO_OF(i + 1, g.files.length)}`} className={`w-full rounded-card object-cover ${i % 3 === 0 ? "sm:col-span-2" : ""}`} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}

export function PhotoGrid({ photos, rooms, title }) {
  const [open, setOpen] = useState(false);
  const [main, ...rest] = photos;
  return (
    <div className="relative" id="photos">
      <div className="grid h-[22rem] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-overlay md:h-[28rem]">
        <Button variant="ghost" onClick={() => setOpen(true)} className="col-span-4 row-span-2 h-full rounded-none p-0 md:col-span-2" aria-label={COPY.LISTING.SHOW_ALL_PHOTOS}>
          <img src={photoUrl(main)} alt={title} className="h-full w-full object-cover transition-[filter] hover:brightness-90" />
        </Button>
        {rest.slice(0, 4).map((p) => (
          <Button key={p} variant="ghost" onClick={() => setOpen(true)} className="hidden h-full rounded-none p-0 md:block" aria-label={COPY.LISTING.SHOW_ALL_PHOTOS}>
            <img src={photoUrl(p)} alt="" className="h-full w-full object-cover transition-[filter] hover:brightness-90" />
          </Button>
        ))}
      </div>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="absolute bottom-4 right-4 shadow-raised">
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        {COPY.LISTING.SHOW_ALL_PHOTOS}
      </Button>
      <PhotoTour open={open} onClose={() => setOpen(false)} rooms={rooms ?? photos.map((file) => ({ file, room: "" }))} />
    </div>
  );
}
