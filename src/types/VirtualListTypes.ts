import { ReactElement, ComponentType } from "react";

interface Components {
    /**
     * Set to render a component at the top of the list.
     *
     * The header remains above the top items and does not remain sticky.
     */
    Header?: ComponentType;
}

export interface VirtualListProps {
    /**
     * Array of items you want to virtualize
     */
    items: Array<any>;

    /**
     * Function to render your items
     */
    renderItem: (index: number, item: any) => ReactElement;

    /**
     * If `true` implements a bottom-to-top scrolling flow
     */
    reverse?: boolean;

    /**
     * Custom components before or after the list
     */
    components?: Components

    /**
     * Called when the end of the list is reached
     * 
     * `NOTE`: is also a startReached for reversed lists
     */
    endReached?: () => void;

    /**
     * Boolean value to determine if the infinite scroller has reached the end
     */
    hasMore?: boolean;
}