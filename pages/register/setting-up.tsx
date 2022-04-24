import LayoutWide from "components/layouts/layout_wide";
import styles from "styles/setting-up.module.scss";
import homeStyles from "styles/home.module.scss";
import Head from "next/head";
import { Plus, X } from "phosphor-react";
import { ReactElement, useEffect, useRef, useState } from "react";
import Router from "next/router";
import axiosInstance from "src/axios";
import { useToastContext } from "src/contexts/toastContext";
import { IBirthday } from "src/types/general";
import { allowedProfileImageMimetypes } from "src/utils/variables";
import { useUserContext } from "src/contexts/userContext";
import axios, { AxiosResponse } from "axios";
import { IUser } from "src/types/general";
import Birthday from "components/birthday/birthday";
import { GetServerSidePropsContext } from "next";

interface PostReqResponse {
    message: string;
}

interface GetReqResponse {
    user: IUser;
}

interface UserSetupProps {
    user: IUser;
}

export default function UserSetup(props: UserSetupProps): ReactElement {
    const toast = useToastContext();
    const { user, login } = useUserContext();

    const dayRef = useRef<HTMLSelectElement>(null);
    const monthRef = useRef<HTMLSelectElement>(null);
    const yearRef = useRef<HTMLSelectElement>(null);

    const [birthday, setBirthday] = useState<IBirthday>(null);
    const [previewImage, setPreviewImage] = useState<string>(null);
    const [profileImage, setProfileImage] = useState<File>(null);
    const [bio, setBio] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target?.files[0];
        if (!file) {
            return;
        }
        if (!allowedProfileImageMimetypes.includes(file.type)) {
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
        let birthday_year = null;
        let birthday_month = null;
        let birthday_day = null;

        if (birthday?.year) {
            birthday_year = birthday.year.toString();
        }
        if (birthday?.month) {
            birthday_month = birthday.month.toString();
        }
        if (birthday?.day) {
            birthday_day = birthday.day.toString();
        }
        const payload: FormData = new FormData();
        payload.append("bio", bio);
        payload.append("birthday_year", birthday_year);
        payload.append("birthday_month", birthday_month);
        payload.append("birthday_day", birthday_day);
        payload.append("profileImage", profileImage);
        axiosInstance
            .post<FormData, AxiosResponse<PostReqResponse>>("users/initialSetup", payload)
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
        if (props.user) {
            login(props.user);
        }
    }, [props.user]);

    if (!user) return null;

    return (
        <>
            <Head>
                <title>Setting up - Twatter</title>
            </Head>
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
                                onClick={(e) => {
                                    e.currentTarget.value = null;
                                }}
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
                        <Birthday
                            selectedBirthday={birthday}
                            setSelectedBirthday={setBirthday}
                            dayRef={dayRef}
                            monthRef={monthRef}
                            yearRef={yearRef}
                        />
                        {birthday?.day != null &&
                            birthday?.month != null &&
                            birthday?.year && (
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
                        !(birthday?.day && birthday?.month && birthday?.year)
                            ? "Skip"
                            : "Finish"}
                    </button>
                </div>
            </LayoutWide>
        </>
    );
}

export async function getServerSideProps(
    context: GetServerSidePropsContext
) {
    let res = null;
    let user: IUser = null;

    try {
        res = await axios.get<GetReqResponse>(
            `${process.env.NEXT_PUBLIC_DOMAIN_URL}/users/validateToken`,
            {
                withCredentials: true,
                headers: {
                    Cookie: `session=${context.req.cookies.session}`,
                },
            }
        );
        user = res.data.user;
    } catch (err) {
        console.error(err);
    }

    if (!user) {
        return {
            redirect: {
                destination: "/login",
            }
        };
    }

    if (user.finished_setup) {
        return {
            redirect: {
                destination: "/home",
            }
        };
    }

    return {
        props: { user: user },
    };
}
