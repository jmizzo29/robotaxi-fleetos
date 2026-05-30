export default function PageHeader({ eyebrow = 'fleetos', title, description, action }) {
  return (
    <header className="mb-5 sm:mb-8">
      <div className="mb-2 flex items-center gap-3 sm:mb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-[#172231]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
          {eyebrow}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <h1 className="mb-2 text-2xl font-semibold leading-tight text-black sm:mb-4 sm:text-4xl xl:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-lg sm:leading-8">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
