export interface LikePayload {
    postId: string;
    likeType: "LIKE" | "UNLIKE";
}

export enum ContextMenuPosition {
    TOP = "TOP",
    RIGHT = "RIGHT",
    BOTTOM = "BOTTOM",
    LEFT = "LEFT"
}

