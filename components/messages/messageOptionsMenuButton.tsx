/* eslint-disable react/react-in-jsx-scope */

import { ReactElement, useState } from "react";
import { DotsThreeVertical } from "phosphor-react";
import styles from "./messageOptionsMenuButton.module.scss";
import { MessageOptionsMenuButtonProps } from "src/types/props";
import ContextMenu from "components/contextMenu/contextMenu";
import ContextMenuItem from "components/contextMenu/contextMenuItem";
import { Trash } from "phosphor-react";
import { ContextMenuPosition } from "src/types/utils";
import axios from "src/axios";
import { useUserContext } from "src/contexts/userContext";
import { useToastContext } from "src/contexts/toastContext";

export default function MessageOptionsMenuButton(
    props: MessageOptionsMenuButtonProps
): ReactElement {
    const { user, socket } = useUserContext();
    const toast = useToastContext();

    const [optionsMenu, setOptionsMenu] = useState(false);
    const [offset, setOffset] = useState(-1);

    const handleDelete = () => {
        setOptionsMenu(!optionsMenu);
        if (user.id != props.messageAuthorId) {
            return;
        }

        const payload = {
            message_id: props.messageId,
            conversation_id: props.conversationId
        };
        const socketPayload = {
            eventType: "deleteMessage",
            data: {
                message_id: props.messageId,
                receiver_id: props.receiverId,
            },
        };

        axios
            .post("messaging/deleteMessage", payload)
            .then(() => {
                socket.send(JSON.stringify(socketPayload));
            })
            .catch((err) => {
                toast(
                    err?.response?.data?.message ?? "An error has occurred",
                    3000
                );
            });
    };

    return (
        <div className="flex align-items-center">
            <div
                className={`pointer ${props.className} ${styles.optionsButton}`}
                onClick={(e) => {
                    setOptionsMenu(!optionsMenu);
                    if (props.parentContainerRef && !optionsMenu) {
                        setOffset(e.clientX);
                    }
                }}
            >
                <DotsThreeVertical size={20} weight="bold" color="grey" />
                {optionsMenu && (
                    <ContextMenu
                        menuPosition={ContextMenuPosition.LEFT}
                        rightOffset={offset}
                    >
                        <ContextMenuItem
                            text="Delete Message"
                            icon={Trash}
                            color="#EC4646"
                            onClick={handleDelete}
                        />
                    </ContextMenu>
                )}
            </div>
        </div>
    );
}
