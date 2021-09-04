interface NullableInt32 {
    Int32: number;
    Valid: boolean;
}

interface NullableInt64 {
    Int64: number;
    Valid: boolean;
}

interface NullableString {
    String: string;
    Valid: boolean;
}

interface NullableBoolean {
    Bool: boolean;
    Valid: boolean;
}

interface DateAndTime {
    Time: Date;
    Valid: boolean;
}

interface IParentUser {
    id: NullableInt64;
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
    created_at: DateAndTime;
    finished_setup: boolean;
}

export interface IConversation {
    id: string;
    members: Array<IUser>;
    participants: Array<IUser>;
    receivers: Array<IUser>;
    unreadMessages: number;
    lastUpdated: string;
    lastMessage: string;
}

interface IParentPost {
    id: NullableInt64;
    author: IParentUser;
    content: NullableString;
    likes: NullableInt32;
    comments: NullableInt32;
    replying_to: IParentPost;
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

    liked?: boolean;
}

interface PostAttachment {
    url: string,
    type: "image" | "gif" | "video",
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
