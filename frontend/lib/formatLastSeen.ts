export function formatLastSeen(lastSeen: string | null) {
    if (!lastSeen) {
        return "Last seen offline";
    }

    const date = new Date(lastSeen);
    const now = new Date();

    const isSameDay = (a: Date, b: Date) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear();

    const time = date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    // Today
    if (isSameDay(date, now)) {
        const diffMs = now.getTime() - date.getTime();
        const minutes = Math.floor(diffMs / 60000);

        if (minutes < 1) {
            return "Last seen just now";
        }

        if (minutes < 60) {
            return `Last seen ${minutes} minute${minutes === 1 ? "" : "s"
                } ago`;
        }

        const hours = Math.floor(minutes / 60);

        return `Last seen ${hours} hour${hours === 1 ? "" : "s"
            } ago`;
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, yesterday)) {
        return `Last seen yesterday at ${time}`;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Older, same year
    if (date.getFullYear() === now.getFullYear()) {
        return `Last seen ${day}/${month} at ${time}`;
    }

    // Older year
    const year = String(date.getFullYear()).slice(-2);

    return `Last seen ${day}/${month}/${year} at ${time}`;
}