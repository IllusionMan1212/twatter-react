/* eslint-disable react/react-in-jsx-scope */
import { PencilSimple, Repeat } from "phosphor-react";
import { ChangeEvent, ReactElement, useEffect, useState } from "react";
import { ButtonType, EditProfilePopupProps } from "src/types/props";
import {
    formatBirthday,
    handleBirthdayDayChange,
    handleBirthdayMonthChange,
    handleBirthdayYearChange,
} from "src/utils/functions";
import Button from "./buttons/button";
import styles from "./editProfilePopup.module.scss";
import homeStyles from "styles/home.module.scss";
import { useToastContext } from "src/contexts/toastContext";
import { IAttachment, IBirthday } from "src/types/general";
import { useUserContext } from "src/contexts/userContext";
import { allowedProfileImageMimetypes } from "src/utils/variables";

interface UpdateProfilePayload {
    eventType: string;
    data: {
        displayName: string;
        profileImage: {
            mimetype: string;
            data: string;
        };
        bio: string;
        birthday?: IBirthday;
    };
}

export default function EditProfilePopup(
    props: EditProfilePopupProps
): ReactElement {
    const toast = useToastContext();
    const { socket } = useUserContext();

    const [maxDays, setMaxDays] = useState(31);
    const [previewImage, setPreviewImage] = useState<string>(null);
    const [profileImage, setProfileImage] = useState<IAttachment>(null);
    const [displayName, setDisplayName] = useState<string>(
        props.userData.display_name
    );
    const [bio, setBio] = useState<string>(props.userData.bio);
    const [showBirthdayFields, setShowBirthdayFields] = useState(false);
    const [selectedBirthday, setSelectedBirthday] = useState<IBirthday>({day: 1, month:1, year: 1});
    const [birthday, setBirthday] = useState(props.userData.birthday.Time.toString());
    const [savingDisabled, setSavingDisabled] = useState(false);

    const handleSaveButtonClick = async () => {
        if (savingDisabled) {
            return;
        }
        if (!displayName) {
            toast("Display name cannot be empty", 3000);
            return;
        }

        const profileImagePayload = {
            mimetype: "",
            data: ""
        };

        if (profileImage) {
            const profileImageBuf = await profileImage.data.arrayBuffer();
            const imageDataArr = new Uint8Array(profileImageBuf);
            const profileImageData = Buffer.from(imageDataArr).toString("base64");

            profileImagePayload.mimetype = profileImage.mimetype;
            profileImagePayload.data = profileImageData;
        }


        const payload: UpdateProfilePayload = {
            eventType: "updateProfile",
            data: {
                displayName: displayName,
                profileImage: profileImagePayload,
                bio: bio,
            },
        };

        if (selectedBirthday?.day && selectedBirthday?.month && selectedBirthday?.year) {
            payload.data.birthday = selectedBirthday;
        }
        socket.send(JSON.stringify(payload));
        props.setEditProfilePopup(false);
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
        if (!props.userData.birthday.Valid) {
            setSelectedBirthday({day: 1, month: 1, year: 1});
        }
    };

    const handleRemoveBirthday = () => {
        const payload = {
            eventType: "removeBirthday",
        };
        setSelectedBirthday(null);
        socket.send(JSON.stringify(payload));
    };

    useEffect(() => {
        if (props.userData.birthday.Valid) {
            setBirthday(formatBirthday(props.userData.birthday.Time.toString()));
        }
    }, [props.userData.birthday]);

    useEffect(() => {
        if (props.userData.birthday) {
            setSelectedBirthday({
                year: new Date(
                    props.userData.birthday.Time.toString()
                ).getUTCFullYear(),
                month:
                    new Date(
                        props.userData.birthday.Time.toString()
                    ).getUTCMonth() + 1,
                day: new Date(
                    props.userData.birthday.Time.toString()
                ).getUTCDate(),
            });
        }
    }, [props.userData.birthday]);

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
                                    props.userData.avatar_url ==
                                    "default_profile.svg" && !previewImage
                                        ? "/"
                                        : ""
                                }${previewImage ?? props.userData.avatar_url}`}
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
                                    defaultValue={props.userData.display_name}
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
                                defaultValue={props.userData.bio}
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
                                    {props.userData.birthday.Valid
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
                                    <div className="flex justify-content-space-between">
                                        <select
                                            className={styles.birthdaySelector}
                                            onChange={(e) =>
                                                handleBirthdayDayChange(
                                                    e,
                                                    setSelectedBirthday,
                                                    selectedBirthday
                                                )
                                            }
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
                                            className={styles.birthdaySelector}
                                            onChange={(e) =>
                                                handleBirthdayMonthChange(
                                                    e,
                                                    setSelectedBirthday,
                                                    selectedBirthday,
                                                    setMaxDays
                                                )
                                            }
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
                                            className={styles.birthdaySelector}
                                            onChange={(e) =>
                                                handleBirthdayYearChange(
                                                    e,
                                                    setSelectedBirthday,
                                                    selectedBirthday,
                                                    setMaxDays
                                                )
                                            }
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
                                                    const year =
                                                        new Date().getUTCFullYear();
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
                                    {props.userData.birthday.Valid && (
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
