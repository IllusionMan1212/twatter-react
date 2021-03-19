export interface User {
    _id: string;
    username: string;
    display_name: string;
    profile_image: string;
    bio: string;
    birthday: string;
    createdAt: string;
    token: string;
}

export interface Conversation {
    _id: string;
    members: Array<User>;
    participants: Array<User>;
    receivers: Array<User>;
    unreadMessages: number,
}

export interface Post {
    _id: string;
    author: User;
    content: string;
    attachments: Array<string>;
    createdAt: string;
    likeUsers: Array<string>;
    comments: Array<Post>;
}

export interface Attachment {
    data: File;
    name: string;
    mimetype: string;
}
