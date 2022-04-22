import { ReactElement, useState } from "react";
import styles from "./birthday.module.scss";
import {
    handleBirthdayDayChange,
    handleBirthdayMonthChange,
    handleBirthdayYearChange,
} from "src/utils/functions";
import { BirthdayProps } from "src/types/props";

const months = ["January", "Feburary", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

export default function Birthday(props: BirthdayProps): ReactElement {
    const [maxDays, setMaxDays] = useState(31);
    const [maxMonths, setMaxMonths] = useState(months.length);

    return (
        <div className="flex justify-content-space-between">
            <select
                ref={props.dayRef}
                className={styles.birthdaySelector}
                onChange={(e) =>
                    handleBirthdayDayChange(
                        e,
                        props.setSelectedBirthday,
                        props.selectedBirthday
                    )
                }
                defaultValue=""
            >
                <option className={styles.dropdownItem} value="" hidden={true}>
                    Day
                </option>
                {new Array(maxDays).fill(null).map((_day, i) => {
                    return (
                        <option
                            key={i + 1}
                            className={styles.dropdownItem}
                            value={i + 1}
                        >
                            {i + 1}
                        </option>
                    );
                })}
            </select>
            <select
                ref={props.monthRef}
                className={styles.birthdaySelector}
                onChange={(e) =>
                    handleBirthdayMonthChange(
                        e,
                        props.setSelectedBirthday,
                        props.selectedBirthday,
                        setMaxDays
                    )
                }
                defaultValue=""
            >
                <option className={styles.dropdownItem} value="" hidden={true}>
                    Month
                </option>
                {new Array(maxMonths).fill(null).map((_, index) => (
                    <option key={index} className={styles.dropdownItem} value={index + 1}>
                        {months[index]}
                    </option>
                ))}
            </select>
            <select
                ref={props.yearRef}
                className={styles.birthdaySelector}
                onChange={(e) =>
                    handleBirthdayYearChange(
                        e,
                        props.setSelectedBirthday,
                        props.selectedBirthday,
                        setMaxDays,
                        setMaxMonths
                    )
                }
                defaultValue=""
            >
                <option className={styles.dropdownItem} value="" hidden={true}>
                    Year
                </option>
                {new Array(100).fill(null).map((_, i) => {
                    const year = new Date().getUTCFullYear();
                    return (
                        <option
                            key={year - i}
                            className={styles.dropdownItem}
                            value={year - i}
                        >
                            {year - i}
                        </option>
                    );
                })}
            </select>
        </div>
    );
}
