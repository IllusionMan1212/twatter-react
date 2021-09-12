import { ReactElement } from "react";
import { ContextMenuItemProps } from "src/types/props";

export default function ContextMenuItem(props: ContextMenuItemProps): ReactElement {
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                props.onClick();
            }}
            style={{color: props.color || "white", fontWeight: "normal"}}
        >
            <props.icon
                size={20}
            />
            {props.text}
        </div>
    )
}
