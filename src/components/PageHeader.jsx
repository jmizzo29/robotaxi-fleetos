export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="page-header-desktop mb-5 hidden animate-fade-up lg:mb-6 lg:block">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-xs font-medium text-ink-muted">{eyebrow}</p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
