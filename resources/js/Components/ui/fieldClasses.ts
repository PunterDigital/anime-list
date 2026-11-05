// Card 4272: the look PrimeVue's Aura dark theme gave text inputs and textareas.
export function fieldClasses(invalid: boolean): string[] {
    return [
        'appearance-none rounded-md border bg-control-field px-3 py-2 text-base leading-normal text-white',
        'shadow-[0_1px_2px_0_rgba(18,18,23,0.05)] outline-none placeholder:text-control-muted',
        'transition-[background-color,color,border-color,outline-color,box-shadow] duration-200',
        'focus:shadow-none disabled:cursor-default disabled:bg-control-track disabled:text-control-muted',
        invalid
            ? 'border-control-danger'
            : 'border-control-border enabled:hover:border-control-border-hover focus:border-control-accent enabled:focus:border-control-accent',
    ]
}
