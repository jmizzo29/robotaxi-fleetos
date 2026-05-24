export default function PageHeader({ eyebrow = 'fleetos', title, description, action }) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="text-xs uppercase tracking-[0.28em] text-emerald-300">
          {eyebrow}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="mb-3 text-3xl font-black leading-tight tracking-tight sm:mb-4 sm:text-4xl xl:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-3xl text-sm text-slate-400 sm:text-lg">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
