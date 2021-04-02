export interface LikePayload {
    postId: string;
    likeType: "LIKE" | "UNLIKE";
}