export function formatLastSeen(lastSeen: string | null) {
    if (!lastSeen) {
        return "Offline";
    }

    const date = new Date(lastSeen);
    const now = new Date();

    const isSameDay =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    // Today → show time
    if (isSameDay) {
        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
        return "Yesterday";
    }

    // Same year → DD/MM
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");

    if (date.getFullYear() === now.getFullYear()) {
        return `${day}/${month}`;
    }

    // Previous years → DD/MM/YY
    const year = String(date.getFullYear()).slice(-2);

    return `${day}/${month}/${year}`;
}