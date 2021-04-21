/* eslint-disable react/react-in-jsx-scope */
import LayoutWide from "../../components/layouts/layout_wide";
import styles from "../../styles/setting-up.module.scss";
import homeStyles from "../../styles/home.module.scss";
import Head from "next/head";
import { Plus, X } from "phosphor-react";
import { ReactElement, useEffect, useRef, useState } from "react";
import Loading from "../../components/loading";
import Router from "next/router";
import axios from "../../src/axios";
import { useToastContext } from "../../src/contexts/toastContext";
import { IUser, IBirthday } from "src/types/general";
import { handleBirthdayDayChange, handleBirthdayMonthChange, handleBirthdayYearChange } from "src/utils/functions";

export default function UserSetup(): ReactElement {
    const toast = useToastContext();

    const dayRef = useRef<HTMLSelectElement>(null);
    const monthRef = useRef<HTMLSelectElement>(null);
    const yearRef = useRef<HTMLSelectElement>(null);

    const [maxDays, setMaxDays] = useState(31);
    const [birthday, setBirthday] = useState<IBirthday>(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [profileImage, setProfileImage] = useState(null);
    const [bio, setBio] = useState("");
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<IUser>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target?.files[0];
        if (
            file.type != "image/jpeg" &&
            file.type != "image/jpg" &&
            file.type != "image/png"
        ) {
            toast("This file format is not supported", 4000);
            return;
        }
        setPreviewImage(URL.createObjectURL(file));
        setProfileImage(file);
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBio(e.target.value);
    };

    const handleClick = () => {
        if (bio.trim().length > 150) {
            toast("Bio cannot be longer than 150 characters", 4000);
            return;
        }
        const payload: FormData = new FormData();
        payload.append("bio", bio);
        payload.append("userId", user._id);
        payload.append("birthday_year", birthday.year.toString());
        payload.append("birthday_month", birthday.month.toString());
        payload.append("birthday_day", birthday.day.toString());
        payload.append("profileImage", profileImage);
        axios
            .post("users/initialSetup", payload)
            .then((res) => {
                toast(res.data.message, 4000);
                Router.push("/home");
            })
            .catch((err) => {
                toast(
                    err?.response?.data?.message ?? "An error has occurred",
                    4000
                );
            });
    };

    const handleCancelBirthday = () => {
        dayRef.current.value = "";
        monthRef.current.value = "";
        yearRef.current.value = "";
        setBirthday({
            day: null,
            month: null,
            year: null,
        });
    };

    const handleCancelProfileImage = () => {
        setProfileImage(null);
        setPreviewImage(null);
    };

    useEffect(() => {
        axios
            .get(
                `${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/users/validateToken`,
                { withCredentials: true }
            )
            .then((res) => {
                if (res.data.user) {
                    setUser(res.data.user);
                    if (res.data.user.finished_setup == true) {
                        Router.push("/home");
                        return;
                    }
                    setLoading(false);
                }
            })
            .catch((err) => {
                toast(
                    err?.response?.data?.message ?? "An error has occurred",
                    4000
                );
                setLoading(false);
            });
    }, []);

    return (
        <>
            <Head>
                <title>Setting up - Twatter</title>
            </Head>
            {!loading ? (
                <LayoutWide>
                    <div className="flex justify-content-center text-white text-extra-large text-bold my-1">
                        <p>Quick Setup</p>
                    </div>
                    <div className="flex flex-column align-items-center">
                        <div className={styles.profileImageContainer}>
                            <div
                                className={styles.profileImage}
                                style={{
                                    backgroundImage: `url(${
                                        previewImage
                                            ? previewImage
                                            : "/default_profile.svg"
                                    })`,
                                }}
                            ></div>
                            <div
                                className={`flex justify-content-center align-items-center ${styles.profileImageOverlay}`}
                            >
                                <input
                                    className={homeStyles.fileInput}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={handleChange}
                                ></input>
                                <Plus
                                    width="95"
                                    height="95"
                                    weight="bold"
                                    color="white"
                                ></Plus>
                            </div>
                            {profileImage && (
                                <div
                                    className={`pointer ${styles.cancelProfileButton}`}
                                    onClick={handleCancelProfileImage}
                                >
                                    <X size="40"></X>
                                </div>
                            )}
                        </div>
                        <p className="text-white text-large my-1">
                            Add a profile picture
                        </p>
                    </div>
                    <div className="flex flex-column align-items-center text-white text-medium my-1">
                        <div className={styles.birthday}>
                            <p className="mb-3Percent">Add your birthday</p>
                            <div className="flex justify-content-space-between">
                                <select
                                    ref={dayRef}
                                    className={styles.dropdownSelector}
                                    onChange={(e) => handleBirthdayDayChange(e, setBirthday, birthday)}
                                    defaultValue=""
                                >
                                    <option
                                        className={styles.dropdownItem}
                                        value=""
                                        hidden={true}
                                    >
                                        Day
                                    </option>
                                    {new Array(maxDays)
                                        .fill(null)
                                        .map((_day, i) => {
                                            return (
                                                <option
                                                    key={i + 1}
                                                    className={
                                                        styles.dropdownItem
                                                    }
                                                    value={i + 1}
                                                >
                                                    {i + 1}
                                                </option>
                                            );
                                        })}
                                </select>
                                <select
                                    ref={monthRef}
                                    className={styles.dropdownSelector}
                                    onChange={(e) => handleBirthdayMonthChange(e, setBirthday, birthday, setMaxDays)}
                                    defaultValue=""
                                >
                                    <option
                                        className={styles.dropdownItem}
                                        value=""
                                        hidden={true}
                                    >
                                        Month
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="1"
                                    >
                                        January
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="2"
                                    >
                                        Feburary
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="3"
                                    >
                                        March
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="4"
                                    >
                                        April
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="5"
                                    >
                                        May
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="6"
                                    >
                                        June
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="7"
                                    >
                                        July
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="8"
                                    >
                                        August
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="9"
                                    >
                                        September
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="10"
                                    >
                                        October
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="11"
                                    >
                                        November
                                    </option>
                                    <option
                                        className={styles.dropdownItem}
                                        value="12"
                                    >
                                        December
                                    </option>
                                </select>
                                <select
                                    ref={yearRef}
                                    className={styles.dropdownSelector}
                                    onChange={(e) => handleBirthdayYearChange(e, setBirthday, birthday, setMaxDays)}
                                    defaultValue=""
                                >
                                    <option
                                        className={styles.dropdownItem}
                                        value=""
                                        hidden={true}
                                    >
                                        Year
                                    </option>
                                    {new Array(100)
                                        .fill(null)
                                        .map((_year, i) => {
                                            const year = new Date().getUTCFullYear();
                                            return (
                                                <option
                                                    key={year - i}
                                                    className={
                                                        styles.dropdownItem
                                                    }
                                                    value={year - i}
                                                >
                                                    {year - i}
                                                </option>
                                            );
                                        })}
                                </select>
                            </div>
                            {birthday.day != null &&
                                birthday.month != null &&
                                birthday.year && (
                                <div
                                    className={`pointer ${styles.cancelBirthdayButton}`}
                                    onClick={handleCancelBirthday}
                                >
                                    <X size="40"></X>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-column align-items-center text-white text-medium mt-2Percent">
                        <div className={styles.bio}>
                            <p className="mb-3Percent">Add a bio</p>
                            <textarea
                                placeholder="Write a short description about yourself..."
                                maxLength={150}
                                onInput={handleInput}
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-content-center text-white text-medium">
                        <button className={styles.button} onClick={handleClick}>
                            {!profileImage &&
                            !bio &&
                            !(birthday.day && birthday.month && birthday.year)
                                ? "Skip"
                                : "Finish"}
                        </button>
                    </div>
                </LayoutWide>
            ) : (
                <Loading width="100" height="100"></Loading>
            )}
        </>
    );
}
