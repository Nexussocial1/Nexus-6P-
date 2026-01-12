
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
  likes: string[];
  comments: Comment[];
  groupId?: string;
  reportCount?: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: any;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[];
}

export interface Report {
  id: string;
  postId: string;
  postContent: string;
  reportedBy: string;
  reason: string;
  timestamp: any;
}
