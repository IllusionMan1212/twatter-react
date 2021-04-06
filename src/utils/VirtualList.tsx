/* eslint-disable react/react-in-jsx-scope */
import { ReactElement, useEffect, useLayoutEffect, useRef, useState } from "react";
import { VirtualListProps } from "../types/VirtualListTypes";

export const VirtualList = (props: VirtualListProps): ReactElement => {
    const parentRef = useRef<HTMLDivElement>(null);

    const [initialBottom, setInitialBottom] = useState(false);
    const [loadedMore, setLoadedMore] = useState(false);

    useLayoutEffect(() => {
        if (props.reverse && !initialBottom) {
            parentRef.current.scrollTop = parentRef.current.scrollHeight;

            if (parentRef.current.scrollTop != 0) {
                setInitialBottom(true);
            }
        }

        if (props.items.length == 0) {
            setInitialBottom(false);
        }
    }, [props.items.length]);

    useEffect(() => {
        if (props.items.length) {
            setLoadedMore(true);
            // TODO: calculate the exact height that needs to be displaced
            // so far i have no idea how to calc it
            parentRef.current.scrollTop += 2000;

            setTimeout(() => {
                setLoadedMore(false);
            }, 300);
        }
    }, [props.items.length]);

    const handleScroll = () => {
        if (!loadedMore) {
            if (props.reverse) {
                const threshold = 30;
    
                if (parentRef.current.scrollTop <= threshold) {
                    props.endReached();
                    setLoadedMore(true);
                }
            } else {
                const threshold = parentRef.current.scrollHeight;
    
                if (parentRef.current.scrollTop >= (threshold - parentRef.current.clientHeight - 30)) {
                    props.endReached();
                    setLoadedMore(true);
                }
            }
        }
    };

    return (
        <div
            ref={parentRef}
            style={{ height: "100%", width: "100%", overflow: "auto" }}
            onScroll={handleScroll}
        >
            {props.components?.Header && (
                <props.components.Header></props.components.Header>
            )}
            {props.items.map((item, index) => {
                return props.renderItem(index, item);
            })}
        </div>
    );
};
