import { ReactElement, useRef, useState, useEffect, CSSProperties } from "react";
import styles from "./contextMenu.module.scss";
import { ContextMenuProps } from "src/types/props";
import { ContextMenuPosition } from "src/types/utils";

export default function ContextMenu(props: ContextMenuProps): ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);

    const [menuPosition, _] = useState(props.menuPosition || ContextMenuPosition.BOTTOM)
    const [style, setStyle] = useState<CSSProperties>({})

    useEffect(() => {
        let top = -1;
        let right = -1;

        if (props.topOffset >= 0) {
            const height = containerRef.current.getBoundingClientRect().height;
            if (props.topOffset < height) {
                top = props.topOffset - height;
            }
        }

        if (props.rightOffset >= 0) {
            const width = containerRef.current.getBoundingClientRect().width;
            if (props.rightOffset < width + 20) {
                right = props.rightOffset - width;
            }
        }

        switch (menuPosition) {
        case ContextMenuPosition.TOP: {
            const style: CSSProperties = {
                bottom: "30px"
            }
            setStyle(style);
            break;
        }
        case ContextMenuPosition.RIGHT: {
            const style: CSSProperties = {
                left: "30px"
            }
            setStyle(style);
            break;
        }
        case ContextMenuPosition.BOTTOM: {
            const style: CSSProperties = {
                top: top != -1 ? top : "30px"
            }
            setStyle(style);
            break;
        }
        case ContextMenuPosition.LEFT: {
            const style: CSSProperties = {
                right: right != -1 ? right: "30px"
            }
            setStyle(style);
            break;
        }
        }
    }, []);

    return (
        <>
            <div
                ref={containerRef}
                className={`pointer ${styles.menu}`}
                style={style}
            >
                {props.children}
            </div>
            <div className="outsideClickOverlay"></div>
        </>
    )
}
