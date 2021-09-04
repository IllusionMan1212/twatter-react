import { SetStateAction } from "react";
import { IBirthday } from "src/types/general";

export const timeSince = (date: string): string => {
    const now = new Date();
    const postDate = new Date(date);
    const difference = now.getTime() - postDate.getTime();

    if (now.getFullYear() > postDate.getFullYear()) {
        // present year is different than post year
        return `${postDate.getDate()} ${postDate
            .toLocaleString("default", { month: "short" })
            .replace(".", "")} ${postDate.getFullYear()}`;
    } else if (difference / (1000 * 60 * 60 * 24) >= 7) {
        // post is older than 1 week, display post's month and day
        return `${postDate
            .toLocaleString("default", { month: "short" })
            .replace(".", "")} ${postDate.getDate()}`;
    } else if (difference / (1000 * 60 * 60 * 24) >= 1) {
        // post is older than one day, display amount of days
        return `${(difference / (1000 * 60 * 60 * 24)).toFixed(0)}d`;
    } else if (difference / (1000 * 60) >= 60) {
        // post is older than 60 minutes, display hours
        return `${(difference / (1000 * 60 * 60)).toFixed(0)}h`;
    } else if (difference / 1000 >= 60) {
        // post is older than 60 seconds, display minutes
        return `${(difference / (1000 * 60)).toFixed(0)}m`;
    } else {
        // post is only several seconds old, display seconds
        return `${(difference / 1000).toFixed(0)}s`;
    }
};

export const formatDate = (date: string): string => {
    const _date = new Date(date);
    return `${_date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    })} - ${_date.getDate()}/${_date.getMonth() + 1}/${_date.getFullYear()}`;
};

const nth = (day: number) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
    case 1:
        return "st";
    case 2:
        return "nd";
    case 3:
        return "rd";
    default:
        return "th";
    }
};

export const formatBirthday = (date: string): string => {
    const _date = new Date(date);
    return `${_date.getUTCDate()}${nth(_date.getUTCDate())} ${_date
        .toLocaleString("default", {
            month: "short",
        })
        .replace(".", "")} ${_date.getUTCFullYear()}`;
};

export const formatJoinDate = (date: string): string => {
    const _date = new Date(date);
    return `${_date.toLocaleString("default", {
        month: "long",
    })} ${_date.getFullYear()}`;
};

export const formatMessageTime = (time: string): string => {
    const _time = new Date(time);
    const now = new Date();
    if (now.getFullYear() > _time.getFullYear()) {
        return `${_time.getDate()}/${_time.getMonth()}/${_time.getFullYear()} at ${_time.toLocaleTimeString(
            "en-US",
            { hour: "2-digit", minute: "2-digit" }
        )}`;
    } else if (now.getDate() > _time.getDate() || now.getMonth() > _time.getMonth()) {
        return `${_time.toLocaleDateString("en-US", {
            month: "short",
        })} ${_time.getDate()} at ${_time.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    } else {
        return `${_time.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    }
};

export const formatBigNumbers = (number: number): string => {
    if (number >= 1000) {
        return `${(number / 1000).toFixed(1)}K`;
    }
    if (number >= 1000000) {
        return `${(number / 1000000).toFixed(1)}M`;
    }
    if (number >= 1000000000) {
        return `${(number / 1000000000).toFixed(1)}B`;
    }
    return number.toString();
};

export const handleBirthdayDayChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setBirthday: (birthday: SetStateAction<IBirthday>) => void,
    birthday: IBirthday
): void => {
    setBirthday({
        ...birthday,
        day: Number(e.target.value),
    });
};

export const handleBirthdayMonthChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setBirthday: (birthday: SetStateAction<IBirthday>) => void,
    birthday: IBirthday,
    setMaxDays: (days: SetStateAction<number>) => void
): void => {
    setBirthday({
        ...birthday,
        month: Number(e.target.value),
    });
    switch (e.target.value) {
    case "1":
    case "3":
    case "5":
    case "7":
    case "8":
    case "10":
    case "12":
        setMaxDays(31);
        break;
    case "4":
    case "6":
    case "9":
    case "11":
        if (birthday?.day > 30) {
            setBirthday({
                ...birthday,
                day: null,
            });
        }
        setMaxDays(30);
        break;
    case "2":
        if (birthday?.year) {
            if (birthday.year % 400 == 0) {
                if (birthday.day > 29) {
                    setBirthday({
                        ...birthday,
                        day: null,
                    });
                }
                setMaxDays(29);
            } else if (birthday.year % 100 == 0) {
                if (birthday.day > 28) {
                    setBirthday({
                        ...birthday,
                        day: null,
                    });
                }
                setMaxDays(28);
            } else if (birthday.year % 4 == 0) {
                if (birthday.day > 29) {
                    setBirthday({
                        ...birthday,
                        day: null,
                    });
                }
                setMaxDays(29);
            } else {
                if (birthday.day > 28) {
                    setBirthday({
                        ...birthday,
                        day: null,
                    });
                }
                setMaxDays(28);
            }
        } else {
            if (birthday.day > 28) {
                setBirthday({
                    ...birthday,
                    day: null,
                });
            }
            setMaxDays(28);
        }
        break;
    default:
        if (birthday?.day > 30) {
            setBirthday({
                ...birthday,
                day: null,
            });
        }
        setMaxDays(30);
        break;
    }
};

export const handleBirthdayYearChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setBirthday: (birthday: SetStateAction<IBirthday>) => void,
    birthday: IBirthday,
    setMaxDays: (days: SetStateAction<number>) => void
): void => {
    setBirthday({
        ...birthday,
        year: Number(e.target.value),
    });

    if (birthday?.month == 2) {
        if (parseInt(e.target.value) % 400 == 0) {
            if (birthday?.day > 29) {
                setBirthday({
                    ...birthday,
                    day: null,
                });
            }
            setMaxDays(29);
        } else if (parseInt(e.target.value) % 100 == 0) {
            if (birthday?.day > 28) {
                setBirthday({
                    ...birthday,
                    day: null,
                });
            }
            setMaxDays(28);
        } else if (parseInt(e.target.value) % 4 == 0) {
            if (birthday?.day > 29) {
                setBirthday({
                    ...birthday,
                    day: null,
                });
            }
            setMaxDays(29);
        } else {
            if (parseInt(e.target.value) > 28) {
                setBirthday({
                    ...birthday,
                    day: null,
                });
            }
            setMaxDays(28);
        }
    }
};
