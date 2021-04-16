/* eslint-disable react/react-in-jsx-scope */
import { PencilSimple } from "phosphor-react";
import { ReactElement } from "react";
import { EditProfilePopupProps } from "src/types/props";
import { formatBirthday } from "src/utils/functions";
import Button from "./buttons/button";
import styles from "./editProfilePopup.module.scss";

export default function EditProfilePopup(
    props: EditProfilePopupProps
): ReactElement {
    const handleClick = () => {
        console.log("saving");
    };

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
                                    props.userData.profile_image ==
                                    "default_profile.svg"
                                        ? "/"
                                        : ""
                                }${props.userData.profile_image}`}
                                className={`round ${styles.profileImage}`}
                            />
                        </div>
                        <div className={styles.names}>
                            <div>
                                <p className="usernameGrey text-bold text-small">
                                    Display Name
                                </p>
                                <input
                                    className={styles.inputs}
                                    defaultValue={props.userData.display_name}
                                />
                            </div>
                            <div>
                                <p className="usernameGrey text-bold text-small">
                                    Username
                                </p>
                                <div className="flex">
                                    @
                                    <input
                                        className={styles.inputs}
                                        defaultValue={props.userData.username}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.body}>
                        <p className="usernameGrey text-bold text-small mb-2Percent">
                            Bio
                        </p>
                        <div className={`mb-1 ${styles.bioContainer}`}>
                            <textarea
                                className={styles.bio}
                                rows={3}
                                defaultValue={props.userData.bio}
                            />
                        </div>
                        <div className="mb-3">
                            <p className="usernameGrey text-bold text-small mb-2Percent">
                                Birthday
                            </p>
                            <div className={styles.birthday}>
                                <p>
                                    {props.userData.birthday
                                        ? formatBirthday(
                                            props.userData.birthday
                                        )
                                        : "No birthday set yet"}
                                </p>
                                <PencilSimple
                                    weight="fill"
                                    color="#6067fe"
                                    size={28}
                                ></PencilSimple>
                            </div>
                        </div>
                        <div className={styles.footer}>
                            <Button
                                text="Save"
                                size={10}
                                handleClick={handleClick}
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
