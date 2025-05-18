type GalleryCardProps = {
  title: string;
  imageUrl?: string;
  link: string;
};


export default function GalleryCard({ title, imageUrl, link }: GalleryCardProps) {
  return (
    <div>
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block group no-underline text-inherit"
    >
      <div className="aspect-square w-full bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden border border-transparent">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center px-3 text-center text-sm text-gray-600 bg-gray-50">
            {title}
          </div>
        )}
      </div>
      </a>
  </div>
  );
}
