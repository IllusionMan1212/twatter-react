import { ChangeEvent, CSSProperties, MutableRefObject, SetStateAction } from "react";
import { IExpandedPost, IPost, IUser } from "./general";
import { LikePayload } from "./utils";

export interface ToastProps {
    text: string;
}

export interface LoadingProps {
    width: string;
    height: string;
}

export interface NavbarLoggedInProps {
    user: IUser;
}

export interface StatusBarProps {
    title: string;
    user: IUser;
    backButton?: boolean;
}

export interface UserContextMenuProps {
    currentUser: IUser;
    open: boolean;
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
    lastUpdated: string;
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

export interface ExpandedPostProps extends Omit<PostProps, "post"> {
    post: IExpandedPost;
    callback?: <T extends unknown[]>(...args: T) => void;
    nowCommenting: boolean;
    setNowCommenting: (value: SetStateAction<boolean>) => void;
}

interface PostOptionsMenuBaseProps {
    postAuthorId: string;
    postAuthorUsername: string;
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
    post: IExpandedPost;
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

export interface CheckboxProps {
    label?: string;
    style?: CSSProperties;
    checked?: boolean;
    disabled?: boolean;
    ref?: MutableRefObject<HTMLInputElement>;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export interface ProfileImageProps {
    width: number;
    height: number;
    src: string;
    hyperlink?: string;
}