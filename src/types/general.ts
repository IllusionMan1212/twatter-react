interface DateAndTime {
    Time: Date;
    Valid: boolean;
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
    _id: string;
    members: Array<IUser>;
    participants: Array<IUser>;
    receivers: Array<IUser>;
    unreadMessages: number;
    lastUpdated: string;
    lastMessage: string;
}

export interface IPost {
    _id: string;
    author: IUser;
    content: string;
    attachments: Array<PostAttachment>;
    createdAt: string;
    likeUsers: Array<string>;
    comments: Array<string>;
    replyingTo: Array<IPost>;

    // not real db values
    numberOfComments?: number;
}

export interface IExpandedPost extends Omit<IPost, "comments"> {
    comments: Array<IPost>;
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
