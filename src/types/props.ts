import { MutableRefObject, SetStateAction } from "react";
import { IPost, IUser } from "./general";
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
    user: IUser;
}

export interface StatusBarProps {
    title: string;
    user: IUser;
    backButton?: boolean;
}

export interface UserContextMenuProps {
    currentUser: IUser;
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
    receivers: Array<IUser>;
    onClick: () => void;
    isActive: boolean;
    unreadMessages: number;
}

export interface MessageMediaModalProps {
    setImageModal: (bool: boolean) => void;
    attachment: string;
}

export interface PostProps {
    post: IPost;
    currentUser?: IUser;
    handleMediaClick: (
        e: React.MouseEvent<HTMLElement, MouseEvent>,
        post: IPost,
        index: number
    ) => void;

    // ref of container that the menu shouldn't exceed in height
    parentContainerRef?: MutableRefObject<HTMLElement>;
}

export interface ExpandedPostProps extends PostProps {
    callback?: <T extends unknown[]>(...args: T) => void;
    nowCommenting: boolean;
    setNowCommenting: (value: SetStateAction<boolean>) => void;
}

interface PostOptionsMenuBaseProps {
    postAuthorId: string;
    currentUserId: string;
    postId: string;
    callback?: <T extends unknown[]>(...args: T) => void;
}

export interface PostOptionsMenuProps extends PostOptionsMenuBaseProps {
    topOffset?: number;
}

export interface PostOptionsMenuButtonProps extends PostOptionsMenuBaseProps {
    // ref of container that the menu shouldn't exceed in height
    parentContainerRef?: MutableRefObject<HTMLElement>;
}

export interface MediaModalProps {
    modalData: {
        post: IPost;
        imageIndex: number;
        currentUser: IUser;
    };
    goBackTwice?: boolean;
    handleMediaClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, post: IPost, index: number) => void;
}

export interface LikeButtonProps {
    post: IPost;
    currentUserId?: string;
    likeUsers: Array<string>;
}

export interface CommentButtonProps {
    post: IPost;
    handleClick: () => void;
    numberOfComments: number;
}

export interface CommentProps {
    comment: IPost;
    currentUser?: IUser;
    handleMediaClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, post: IPost, index: number) => void;

    // ref of container that the menu shouldn't pop out of
    parentContainerRef?: MutableRefObject<HTMLElement>;
}

export interface ModalCommentProps extends CommentProps {
    updateModalCommentLikes: (payload: LikePayload) => void;
}

export interface ImageContainerProps {
    post: IPost;
    handleMediaClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, post: IPost, index: number) => void;
}

export interface ProfileProps {
    user: IUser;
}

export interface UserPostProps {
    post: IPost;
}

export enum ButtonType {
    Regular = 1,
    Danger,
    Warning
}

export interface ButtonProps {
    size: number;
    text: string;
    type: ButtonType;
    handleClick: () => void;
}

export interface SuggestedUsersProps {
    users: Array<IUser>;
}

export interface SuggestedUserProps {
    user: IUser;
}

export interface EditProfilePopupProps {
    setEditProfilePopup: (value: SetStateAction<boolean>) => void;
    userData: IUser;
}