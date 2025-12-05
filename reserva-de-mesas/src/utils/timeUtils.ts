export function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60000);
}

export function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
    return startA < endB && startB < endA;
}
