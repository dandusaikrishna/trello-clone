import type {
  BOARD,
  BOARD_DETAILS,
  BOARD_MEMBER,
  CARD_WITH_RELATIONS,
  LIST_WITH_CARDS,
  USER,
  WORKSPACE,
} from "./types";

// Dummy user
export const dummyUser: USER = {
  id: "member-1",
  name: "Sai Krishna Dandu",
  email: "228r5a0407@gmail.com",
  avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sai",
};

// Dummy board members
export const dummyBoardMembers: BOARD_MEMBER[] = [
  {
    userId: "member-1",
    role: "ADMIN",
    joinedAt: new Date().toISOString(),
    user: dummyUser,
  },
  {
    userId: "member-2",
    role: "MEMBER",
    joinedAt: new Date().toISOString(),
    user: {
      id: "member-2",
      name: "John Doe",
      email: "john@example.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    },
  },
  {
    userId: "member-3",
    role: "MEMBER",
    joinedAt: new Date().toISOString(),
    user: {
      id: "member-3",
      name: "Alice Johnson",
      email: "alice@example.com",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
    },
  },
];

// Dummy cards
export const dummyCards: CARD_WITH_RELATIONS[] = [
  {
    id: "card-1",
    title: "Setup project structure",
    description: "Initialize the project with necessary folders and files",
    listId: "list-1",
    position: 0,
    status: "ACTIVE",
    dueComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    members: [dummyUser],
    checklists: [],
    comments: [],
  },
  {
    id: "card-2",
    title: "Design database schema",
    description: "Create the Prisma schema for the database",
    listId: "list-1",
    position: 1,
    status: "ACTIVE",
    dueComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    members: [dummyBoardMembers[1].user],
    checklists: [],
    comments: [],
  },
  {
    id: "card-3",
    title: "Implement authentication",
    description: "Add JWT-based authentication to the backend",
    listId: "list-2",
    position: 0,
    status: "ACTIVE",
    dueComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    members: [dummyBoardMembers[1].user, dummyBoardMembers[2].user],
    checklists: [],
    comments: [],
  },
  {
    id: "card-4",
    title: "Build API endpoints",
    description: "Create REST API endpoints for boards and cards",
    listId: "list-2",
    position: 1,
    status: "ACTIVE",
    dueComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    members: [dummyUser],
    checklists: [],
    comments: [],
  },
  {
    id: "card-5",
    title: "Create UI components",
    description: "Build React components for the frontend",
    listId: "list-3",
    position: 0,
    status: "ACTIVE",
    dueComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    members: [dummyBoardMembers[2].user],
    checklists: [],
    comments: [],
  },
  {
    id: "card-6",
    title: "Setup drag and drop",
    description: "Implement drag and drop with dnd-kit",
    listId: "list-3",
    position: 1,
    status: "ACTIVE",
    dueComplete: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    labels: [],
    members: [dummyUser],
    checklists: [],
    comments: [],
  },
];

// Dummy lists with cards
export const dummyLists: LIST_WITH_CARDS[] = [
  {
    id: "list-1",
    title: "To Do",
    boardId: "board-1",
    position: 0,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: dummyCards.filter((card) => card.listId === "list-1"),
  },
  {
    id: "list-2",
    title: "In Progress",
    boardId: "board-1",
    position: 1,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: dummyCards.filter((card) => card.listId === "list-2"),
  },
  {
    id: "list-3",
    title: "In Review",
    boardId: "board-1",
    position: 2,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: dummyCards.filter((card) => card.listId === "list-3"),
  },
  {
    id: "list-4",
    title: "Done",
    boardId: "board-1",
    position: 3,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    cards: [],
  },
];

// Dummy boards
export const dummyBoards: BOARD[] = [
  {
    id: "board-1",
    title: "Trello Clone Project",
    ownerId: "member-1",
    workspaceId: "workspace-1",
    backgroundColor: "#0079bf",
    visibility: "PRIVATE",
    isClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "board-2",
    title: "Marketing Campaign",
    ownerId: "member-1",
    workspaceId: "workspace-1",
    backgroundColor: "#519839",
    visibility: "PRIVATE",
    isClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "board-3",
    title: "Product Roadmap",
    ownerId: "member-1",
    workspaceId: "workspace-1",
    backgroundColor: "#b04632",
    visibility: "WORKSPACE",
    isClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Dummy workspace
export const dummyWorkspace: WORKSPACE = {
  id: "workspace-1",
  name: "Personal Workspace",
  slug: "personal-workspace",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Dummy board details
export const dummyBoardDetails: BOARD_DETAILS = {
  board: dummyBoards[0],
  members: dummyBoardMembers,
  lists: dummyLists,
  labels: [],
};
