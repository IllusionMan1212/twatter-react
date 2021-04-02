import { SetStateAction } from "react";
import { Post, User } from "./general";
import { LikePayload } from "./utils";

export interface ToastProps {
    text: string;
}

export interface LoadingProps {
    width: string;
    height: string;
}

export interface NavbarLoggedInProps {
    setMediaModal?: (active: boolean) => void;
    user: User;
}

export interface StatusBarProps {
    title: string;
    user: User;
    backButton?: boolean;
}

export interface UserContextMenuProps {
    currentUser: User;
}

export interface MessageProps {
    sender: boolean;
    children: string;
    sentTime: string;
    attachment: string;
    conversationId: string;
    setImageModal: (bool: boolean) => void;
    setModalAttachment: (attachment: string) => void;
}

export interface MessageListItemProps {
    lastMessage: string;
    receivers: Array<User>;
    onClick: () => void;
    isActive: boolean;
    unreadMessages: number;
}

export interface MessageMediaModalProps {
    setImageModal: (bool: boolean) => void;
    attachment: string;
}

export interface PostProps {
    post: Post;
    currentUser?: User;
    handleMediaClick: (
        e: React.MouseEvent<HTMLElement, MouseEvent>,
        post: Post,
        index: number
    ) => void;
    handleLike: (payload: LikePayload) => void;
}

export interface ExpandedPostProps extends PostProps {
    callback?: <T extends unknown[]>(...args: T) => void;
    handleComment: (payload: Post) => void;
    handlePostDelete?: (payload: string) => void;
    nowCommenting: boolean;
    setNowCommenting: (value: SetStateAction<boolean>) => void;
}

export interface PostOptionsMenuProps {
    postAuthorId: string;
    currentUserId: string;
    postId: string;
    callback?: <T extends unknown[]>(...args: T) => void;
    handlePostDelete?: (payload: string) => void;
}

export interface MediaModalProps {
    modalData: {
        post: Post;
        imageIndex: number;
        currentUser: User;
    };
    goBackTwice?: boolean;
    handleMediaClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, post: Post, index: number) => void;
    handleComment: (payload: Post) => void;
    handleCommentDelete: (commentId: string) => void;
}

export interface LikeButtonProps {
    post: Post;
    currentUserId?: string;
    handleLike: (payload: LikePayload) => void;
    likeUsers: Array<string>;
}

export interface CommentButtonProps {
    post: Post;
    handleClick: () => void;
    numberOfComments: number;
}

export interface CommentProps {
    comment: Post;
    currentUser?: User;
    handleMediaClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, post: Post, index: number) => void;
}

export interface ModalCommentProps extends CommentProps {
    updateModalCommentLikes: (payload: LikePayload) => void;
}

export interface ImageContainerProps {
    post: Post;
    handleMediaClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, post: Post, index: number) => void;
}