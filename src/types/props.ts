import { ChangeEvent, CSSProperties, MutableRefObject, SetStateAction, ReactNode, ForwardRefExoticComponent } from "react";
import { IPost, IUser, DateAndTime } from "./general";
import { IconProps } from "phosphor-react";
import { ContextMenuPosition } from "src/types/utils";

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
    messageId: string;
    messageAuthorId: string;
    sender: boolean;
    children: string;
    sentTime: string;
    attachment: string;
    conversationId: string;
    setImageModal: (bool: boolean) => void;
    setModalAttachment: (attachment: string) => void;

    // ref of container that the options menu shouldn't exceed in width and height
    parentContainerRef?: MutableRefObject<HTMLElement>;
}

export interface DeletedMessageProps {
    sender: boolean;
    sentTime: string;
    conversationId: string;
}

export interface ConversationsListItemProps {
    lastMessage: string;
    lastUpdated: DateAndTime;
    receiver: IUser;
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
    post: IPost;
    callback?: <T extends unknown[]>(...args: T) => void;
    nowCommenting: boolean;
    setNowCommenting: (value: SetStateAction<boolean>) => void;
    comments: Array<IPost>;
    loadingComments: Boolean;
}

export interface ContextMenuProps {
    topOffset?: number;
    rightOffset?: number;
    menuPosition?: ContextMenuPosition;
    children: ReactNode;
}

export interface ContextMenuItemProps {
    onClick: () => void;
    icon: ForwardRefExoticComponent<IconProps>;
    color?: string;
    text: string;
}

export interface PostOptionsMenuButtonProps {
    // ref of container that the menu shouldn't exceed in height
    parentContainerRef?: MutableRefObject<HTMLElement>;
    postAuthorId: string;
    postAuthorUsername: string;
    currentUserId: string;
    postId: string;
    deleteCallback?: <T extends unknown[]>(...args: T) => void;
}

export interface MessageOptionsMenuButtonProps {
    className: string;
    // ref of container that the options menu shouldn't exceed in width and height
    parentContainerRef?: MutableRefObject<HTMLElement>;
    messageId: string;
    messageAuthorId: string;
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
    likes: number;
    liked: boolean;
}

export interface CommentButtonProps {
    post: IPost;
    handleClick: () => void;
}

export interface CommentProps {
    comment: IPost;
    currentUser?: IUser;
    handleMediaClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, post: IPost, index: number) => void;

    // ref of container that the menu shouldn't pop out of
    parentContainerRef?: MutableRefObject<HTMLElement>;
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
