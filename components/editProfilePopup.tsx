import { PencilSimple, Repeat } from "phosphor-react";
import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import { ButtonType, EditProfilePopupProps } from "src/types/props";
import { formatBirthday } from "src/utils/functions";
import Button from "./buttons/button";
import styles from "./editProfilePopup.module.scss";
import homeStyles from "styles/home.module.scss";
import { useToastContext } from "src/contexts/toastContext";
import { DateAndTime, IAttachment, IBirthday } from "src/types/general";
import { useUserContext } from "src/contexts/userContext";
import { allowedProfileImageMimetypes } from "src/utils/variables";
import Birthday from "components/birthday/birthday";
import axiosInstance from "src/axios";
import { AxiosResponse } from "axios";

interface ApiResponse {
    message: string;
    status: number;
    success: boolean;
    data: {
        userId: string;
        displayName: string;
        bio: string;
        profileImage: string;
        profileImageMimetype: string;
        birthday: DateAndTime;
    }
}

export default function EditProfilePopup(
    props: EditProfilePopupProps
): ReactElement {
    const toast = useToastContext();
    const { user, socket } = useUserContext();

    const [previewImage, setPreviewImage] = useState<string>(null);
    const [profileImage, setProfileImage] = useState<IAttachment>(null);
    const [displayName, setDisplayName] = useState<string>(
        user.display_name
    );
    const [bio, setBio] = useState<string>(user.bio);
    const [showBirthdayFields, setShowBirthdayFields] = useState(false);
    const [selectedBirthday, setSelectedBirthday] = useState<IBirthday>({day: 1, month:1, year: 1});
    const [birthday, setBirthday] = useState(user.birthday.Time.toString());
    const [isBirthdaySet, setIsBirthdaySet] = useState("false");
    const [savingDisabled, setSavingDisabled] = useState(false);

    const handleSaveButtonClick = async () => {
        if (savingDisabled) {
            return;
        }
        if (!displayName) {
            toast("Display name cannot be empty", 3000);
            return;
        }

        if (bio.length > 150) {
            toast("Bio cannot be longer than 150 characters", 4000);
            return;
        }

        const payload: FormData = new FormData();
        payload.append("displayName", displayName);
        payload.append("bio", bio);
        payload.append("isBirthdaySet", isBirthdaySet);

        if (profileImage) {
            payload.append("profileImage", profileImage.data);
        }

        if (selectedBirthday?.day && selectedBirthday?.month && selectedBirthday?.year) {
            payload.append("birthday_day", selectedBirthday.day.toString());
            payload.append("birthday_month", selectedBirthday.month.toString());
            payload.append("birthday_year", selectedBirthday.year.toString());
        }

        axiosInstance.post<FormData, AxiosResponse<ApiResponse>>("users/updateProfile", payload)
            .then((res) => {
                props.setEditProfilePopup(false);

                const socketPayload = {
                    eventType: "updateProfile",
                    data: res.data.data
                };
                socket.send(JSON.stringify(socketPayload));
            })
            .catch((err) => {
                toast(err?.response?.data?.message || "An error has occurred", 3000);
            });
    };

    const handleProfileImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target?.files[0];
        if (!allowedProfileImageMimetypes.includes(file.type)) {
            toast("This file format is not supported", 4000);
            return;
        }
        setPreviewImage(URL.createObjectURL(file));
        setProfileImage({
            data: file,
            mimetype: file.type,
            name: file.name,
            size: file.size,
        });
    };

    const handleCancelBirthday = () => {
        setShowBirthdayFields(false);
        if (!user.birthday.Valid) {
            setSelectedBirthday({day: 1, month: 1, year: 1});
            setIsBirthdaySet("false");
        }
    };

    const handleRemoveBirthday = () => {
        axiosInstance.delete("users/removeBirthday")
            .then(() => {
                setSelectedBirthday({
                    day: 1,
                    month: 1,
                    year: 1
                });
                setIsBirthdaySet("false");

                const payload = {
                    eventType: "birthdayRemoved",
                    data: {
                        userId: user.id
                    }
                };
                socket.send(JSON.stringify(payload));
            })
            .catch((err) => {
                toast(err?.response?.data?.message || "An error has occurred", 3000);
            });

    };

    useEffect(() => {
        if (selectedBirthday?.year != 1 && selectedBirthday?.month != 1 && selectedBirthday?.day != 1) {
            setIsBirthdaySet("true");
        }
    }, [selectedBirthday]);

    useEffect(() => {
        if (user.birthday.Valid) {
            setBirthday(formatBirthday(user.birthday.Time.toString()));
            setIsBirthdaySet("true");
        }
    }, [user.birthday]);

    useEffect(() => {
        if (user.birthday.Valid) {
            setSelectedBirthday({
                year: new Date(
                    user.birthday.Time.toString()
                ).getUTCFullYear(),
                month:
                    new Date(
                        user.birthday.Time.toString()
                    ).getUTCMonth() + 1,
                day: new Date(
                    user.birthday.Time.toString()
                ).getUTCDate(),
            });
        }
    }, [user.birthday]);

    return (
        <div
            className={styles.container}
            onClick={() => props.setEditProfilePopup(false)}
        >
            <div
                className={styles.popupContainer}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.popup}>
                    <div className={styles.header}>
                        <div className={styles.profileImageContainer}>
                            <img
                                src={`${
                                    user.avatar_url ==
                                    "default_profile.svg" && !previewImage
                                        ? "/"
                                        : ""
                                }${previewImage ?? user.avatar_url}`}
                                className={`round ${styles.profileImage}`}
                                alt="Profile Image"
                            />
                            <div className={styles.imageOverlay}>
                                <div className={styles.iconBackground}>
                                    <Repeat size={28} weight="regular"></Repeat>
                                </div>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png"
                                    className={homeStyles.fileInput}
                                    onChange={handleProfileImageChange}
                                />
                            </div>
                        </div>
                        <div className={styles.displayName}>
                            <div>
                                <p className="usernameGrey text-bold">
                                    Display Name
                                </p>
                                <input
                                    className={styles.inputs}
                                    defaultValue={user.display_name}
                                    maxLength={16}
                                    max={16}
                                    onChange={(e) => {
                                        const name = e.target.value.trim();
                                        setDisplayName(name);
                                        setSavingDisabled(!name);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.body}>
                        <p className="usernameGrey text-bold mb-2Percent">
                            Bio
                        </p>
                        <div className={`mb-1 ${styles.bioContainer}`}>
                            <textarea
                                className={styles.bio}
                                rows={3}
                                defaultValue={user.bio}
                                maxLength={150}
                                onChange={(e) => setBio(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <p className="usernameGrey text-bold mb-2Percent">
                                Birthday
                            </p>
                            <div
                                className={styles.birthday}
                                onClick={() => setShowBirthdayFields(true)}
                            >
                                <p>
                                    {user.birthday.Valid
                                        ? birthday
                                        : "No birthday set yet"}
                                </p>
                                <PencilSimple
                                    weight="fill"
                                    color="#6067fe"
                                    size={28}
                                ></PencilSimple>
                            </div>
                            {showBirthdayFields && (
                                <div className="flex flex-column gap-1 mt-1">
                                    <Birthday 
                                        selectedBirthday={selectedBirthday}
                                        setSelectedBirthday={setSelectedBirthday}
                                    />
                                    {user.birthday.Valid && (
                                        <Button
                                            text="Remove Birthday"
                                            size={10}
                                            type={ButtonType.Danger}
                                            handleClick={handleRemoveBirthday}
                                        ></Button>
                                    )}
                                    <div
                                        className="underline pointer dangerRed"
                                        onClick={handleCancelBirthday}
                                    >
                                        Cancel birthday edit
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className={styles.footer}>
                            <Button
                                text="Save"
                                size={10}
                                type={ButtonType.Regular}
                                handleClick={handleSaveButtonClick}
                                disabled={savingDisabled}
                            ></Button>
                            <span
                                className="underline pointer"
                                onClick={() => props.setEditProfilePopup(false)}
                            >
                                Cancel
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
