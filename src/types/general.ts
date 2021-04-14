export interface IUser {
    _id: string;
    username: string;
    display_name: string;
    profile_image: string;
    bio: string;
    birthday: string;
    createdAt: string;
    token: string;
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
    attachments: Array<string>;
    createdAt: string;
    likeUsers: Array<string>;
    comments: Array<IPost>;
    replyingTo: Array<IPost>;

    // not real db values
    numberOfComments?: number;
}

export interface IAttachment {
    data: File;
    name: string;
    mimetype: string;
    size: number;
}
