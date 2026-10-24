export function Logo() {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center gap-[5px]"
      >
        <i className="h-3 w-[2.5px] rotate-[18deg] rounded-full bg-current" />
        <i className="h-6 w-[2.5px] rotate-[18deg] rounded-full bg-current" />
        <i className="h-3 w-[2.5px] rotate-[18deg] rounded-full bg-current" />
      </span>

      <span className="font-display text-[17px] font-bold tracking-tight">
        Sales Copilot
      </span>
    </div>
  )
}
