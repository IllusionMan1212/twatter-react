import {
    ChangeEvent,
    CSSProperties,
    MutableRefObject,
    SetStateAction,
    ReactNode,
    ForwardRefExoticComponent,
    Dispatch,
    MouseEventHandler,
    RefAttributes
} from "react";
import { IPost, IUser, IBirthday, IAttachment, DateAndTime, IToast } from "./general";
import { IconProps } from "phosphor-react";
import { ContextMenuPosition } from "src/types/utils";
import { MessagingState } from "src/reducers/messagingReducer";
import { MessagingAction } from "src/actions/messagingActions";
import { SettingsAction } from "src/actions/settingsActions";
import { SettingsState } from "src/reducers/settingsReducer";

export interface LayoutProps {
    children: ReactNode;
}

export interface ToastProps {
    text: string;
}

export interface LoadingProps {
    width: string;
    height: string;
}

export interface MessageProps {
    dispatch: Dispatch<MessagingAction>;
    messageId: string;
    messageAuthorId: string;
    receiverId: string;
    sender: boolean;
    children: string;
    sentTime: string;
    attachment: string;
    conversationId: string;

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
    state: MessagingState;
}

export interface PostProps {
    post: IPost;
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
    comments: Array<IPost>;
    loadingComments: boolean;
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
    postId: string;
    deleteCallback?: <T extends unknown[]>(...args: T) => void;
}

export interface MessageOptionsMenuButtonProps {
    className: string;
    // ref of container that the options menu shouldn't exceed in width and height
    parentContainerRef?: MutableRefObject<HTMLElement>;
    messageId: string;
    messageAuthorId: string;
    receiverId: string;
    conversationId: string;
}

export interface MediaModalProps {
    modalData: {
        post: IPost;
        imageIndex: number;
    };
    goBackTwice?: boolean;
    handleMediaClick: (e: React.MouseEvent<HTMLElement, MouseEvent>, post: IPost, index: number) => void;
}

export interface LikeButtonProps {
    post: IPost;
    likes: number;
    liked: boolean;
}

export interface CommentButtonProps {
    post: IPost;
    handleClick: () => void;
}

export interface CommentProps {
    comment: IPost;
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
    disabled?: boolean;
    handleClick: () => void;
}

export interface SuggestedUsersProps {
    users: Array<IUser>;
}

export interface SuggestedUserProps {
    user: IUser;
}

export interface EditProfilePopupProps {
    setEditProfilePopup: Dispatch<SetStateAction<boolean>>;
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
    onlineIndicator?: boolean;
    alt: string;
}

export interface ContextWrapperProps {
    children: ReactNode;
}

export interface BirthdayProps {
    selectedBirthday: IBirthday
    setSelectedBirthday: Dispatch<SetStateAction<IBirthday>>;
    dayRef?: MutableRefObject<HTMLSelectElement>;
    monthRef?: MutableRefObject<HTMLSelectElement>;
    yearRef?: MutableRefObject<HTMLSelectElement>;
}

export interface ReplyingToProps {
    avatar_size: number;
    post: IPost;
}

export interface CommentBoxProps {
    postId: string;
}

export interface ConversationsListProps {
    state: MessagingState;
    dispatch: Dispatch<MessagingAction>;
}

export interface MessageBoxProps {
    state: MessagingState;
    sendingAllowed: boolean;
    setSendingAllowed: Dispatch<SetStateAction<boolean>>;
    nowSending: boolean;
    setNowSending: Dispatch<SetStateAction<boolean>>;
    charsLeft: number;
    setCharsLeft: Dispatch<SetStateAction<number>>;
    messageBoxRef: MutableRefObject<HTMLSpanElement>;
    attachments: IAttachment[];
    setAttachments: Dispatch<SetStateAction<IAttachment[]>>;
    previewImages: string[];
    setPreviewImages: Dispatch<SetStateAction<string[]>>;
}

export interface ActiveConversationProps {
    state: MessagingState;
    dispatch: Dispatch<MessagingAction>;
    atBottom: boolean;
    setAtBottom: Dispatch<SetStateAction<boolean>>;
    newMessagesAlert: boolean;
    setNewMessagesAlert: Dispatch<SetStateAction<boolean>>;
    nowSending: boolean;
    setNowSending: Dispatch<SetStateAction<boolean>>;
}

export interface TrendingItemProps {
    hashtag: string;
    description: string;
    link: string;
}

export interface FriendsProps {
    count: number;
}

export interface FriendProps {
    username: string;
    displayName: string;
    avatarURL: string;
}

export interface AdProps {
    title: string;
    description: string;
    link: string;
    linkText: string;
    imageLink: string;
}

export interface ShareProps {
    text: string;
    url: string;
}

export interface NavItemProps {
    children: ReactNode;
    to?: string;
    as?: string;
    onClick?: MouseEventHandler<HTMLElement>;
}

export interface SettingsListItemProps {
    title: string;
    description: string;
    icon: ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
    onClick: MouseEventHandler<HTMLElement>;
    isActive: boolean;
}

export interface SwitchProps {
    name?: string;
    disabled?: boolean;
    checked?: boolean;
}

export interface SettingsListProps {
    state: SettingsState;
    dispatch: Dispatch<SettingsAction>;
}

export interface SettingsAreaProps {
    state: SettingsState;
    dispatch: Dispatch<SettingsAction>;
}

export interface AccountSettingsProps {
    dispatch: Dispatch<SettingsAction>;
}

export interface SettingsPopupProps {
    dispatch: Dispatch<SettingsAction>;
}

export interface ToasterProps {
    toasts: IToast[];
}
