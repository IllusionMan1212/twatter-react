export interface NullableString {
    String: string;
    Valid: boolean;
}

interface NullableBoolean {
    Bool: boolean;
    Valid: boolean;
}

export interface DateAndTime {
    Time: Date;
    Valid: boolean;
}

interface IParentUser {
    id: NullableString;
    username: NullableString;
    display_name: NullableString;
    avatar_url: NullableString;
    bio: NullableString;
    birthday: DateAndTime;
    created_at: DateAndTime;
    finished_setup: NullableBoolean;
}

export interface IUser {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    bio: string;
    birthday: DateAndTime;
    created_at: string;
    finished_setup: boolean;
}

export interface IConversation {
    id: string;
    receiver: IUser;
    unread_messages: number;
    last_updated: DateAndTime;
    last_message: NullableString;
}

export interface IActiveConversation {
    id: string;
    receiver_id: string;
    display_name: string;
    username: string;
}

interface IParentPost {
    id: NullableString;
    author: IParentUser;
    content: NullableString;
}

export interface IPost {
    id: string;
    author: IUser;
    content: string;
    attachments: Array<PostAttachment>;
    created_at: string;
    likes: number;
    comments: number;
    replying_to: IParentPost;
    parent_deleted: boolean;

    liked?: boolean;
}

interface PostAttachment {
    url: string,
    type: "image" | "gif" | "video",
    bg_color: string,
}

export interface IAttachment {
    data: File;
    name: string;
    mimetype: string;
    size: number;
}

export interface IBirthday {
    year: number;
    month: number;
    day: number;
}

export interface IMessage {
    id: string;
    author_id: string;
    conversation_id: string;
    content: string;
    sent_time: string;
    attachment: PostAttachment;
    deleted: boolean;
}

export interface ISocketMessage extends IMessage {
    receiver_id: string;
}

export interface IToast {
    id: string;
    text: string;
}

