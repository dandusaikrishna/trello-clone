/* ------------------------------------------------ */
/* API ENVELOPE */
/* ------------------------------------------------ */

export type API_SUCCESS<T> = {
  success: true;
  data: T;
};

export type API_ERROR = {
  success: false;
  message: string;
};

/* ------------------------------------------------ */
/* ENUM TYPES */
/* ------------------------------------------------ */

export type WORKSPACE_ROLE = "OWNER" | "ADMIN" | "MEMBER";
export type BOARD_ROLE = "ADMIN" | "MEMBER" | "OBSERVER";
export type BOARD_VISIBILITY = "PRIVATE" | "WORKSPACE" | "PUBLIC";
export type ENTITY_STATUS = "ACTIVE" | "ARCHIVED";
export type ATTACHMENT_KIND = "FILE" | "LINK";

/* ------------------------------------------------ */
/* USER */
/* ------------------------------------------------ */

export type USER = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
};

/* ------------------------------------------------ */
/* WORKSPACE */
/* ------------------------------------------------ */

export type WORKSPACE = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type WORKSPACE_MEMBER = {
  userId: string;
  role: WORKSPACE_ROLE;
  joinedAt: string;
  user: USER;
};

export type WORKSPACE_DETAILS = WORKSPACE & {
  members: WORKSPACE_MEMBER[];
  boards: BOARD[];
};

/* ------------------------------------------------ */
/* BOARD */
/* ------------------------------------------------ */

export type BOARD = {
  id: string;
  title: string;
  ownerId: string;
  workspaceId: string;
  visibility: BOARD_VISIBILITY;
  isClosed: boolean;
  isStarred?: boolean;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type BOARD_MEMBER = {
  userId: string;
  role: BOARD_ROLE;
  joinedAt: string;
  user: USER;
};

/* ------------------------------------------------ */
/* LIST */
/* ------------------------------------------------ */

export type LIST = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  status: ENTITY_STATUS;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

/* ------------------------------------------------ */
/* CARD */
/* ------------------------------------------------ */

export type CARD = {
  id: string;
  listId: string;
  title: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  dueComplete: boolean;
  coverColor?: string;
  coverAttachmentId?: string;
  position: number;
  status: ENTITY_STATUS;
  createdAt: string;
  updatedAt: string;
};

export type CARD_WITH_RELATIONS = CARD & {
  labels: LABEL[];
  members: USER[];
  checklists: CHECKLIST_WITH_ITEMS[];
  comments?: COMMENT[];
  attachments?: ATTACHMENT[];
  coverAttachment?: ATTACHMENT;
};

export type LIST_WITH_CARDS = LIST & {
  cards: CARD_WITH_RELATIONS[];
};

export type BOARD_DETAILS = {
  board: BOARD;
  members: BOARD_MEMBER[];
  lists: LIST_WITH_CARDS[];
  labels: LABEL[];
};

/* ------------------------------------------------ */
/* LABEL */
/* ------------------------------------------------ */

export type LABEL = {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
};

/* ------------------------------------------------ */
/* CHECKLIST */
/* ------------------------------------------------ */

export type CHECKLIST = {
  id: string;
  cardId: string;
  title: string;
  createdAt: string;
};

export type CHECKLIST_ITEM = {
  id: string;
  checklistId: string;
  title: string;
  isCompleted: boolean;
  position: number;
  dueDate?: string;
  assignedTo?: USER;
  createdAt: string;
};

export type CHECKLIST_WITH_ITEMS = CHECKLIST & {
  items: CHECKLIST_ITEM[];
};

/* ------------------------------------------------ */
/* COMMENT */
/* ------------------------------------------------ */

export type COMMENT = {
  id: string;
  cardId: string;
  content: string;
  user: USER;
  createdAt: string;
  updatedAt: string;
};

/* ------------------------------------------------ */
/* ATTACHMENT */
/* ------------------------------------------------ */

export type ATTACHMENT = {
  id: string;
  cardId: string;
  kind: ATTACHMENT_KIND;
  url: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
};

/* ------------------------------------------------ */
/* AUTH */
/* ------------------------------------------------ */

export type LOGIN_PAYLOAD = {
  email: string;
  password: string;
};

export type LOGIN_RESPONSE = {
  user: USER;
};

export type ME_RESPONSE = {
  user: USER;
};

/* ------------------------------------------------ */
/* MUTATION PAYLOADS */
/* ------------------------------------------------ */

export type CREATE_BOARD_PAYLOAD = {
  title: string;
  workspaceId: string;
  visibility?: BOARD_VISIBILITY;
  backgroundColor?: string | null;
};

export type UPDATE_BOARD_PAYLOAD = {
  title?: string;
  visibility?: BOARD_VISIBILITY;
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
};

export type CREATE_LIST_PAYLOAD = {
  boardId: string;
  title: string;
};

export type UPDATE_LIST_PAYLOAD = {
  title: string;
};

export type REORDER_LISTS_PAYLOAD = {
  boardId: string;
  lists: Array<{ id: string; position: number }>;
};

export type CREATE_CARD_PAYLOAD = {
  listId: string;
  title: string;
};

export type UPDATE_CARD_PAYLOAD = {
  title?: string;
  description?: string;
  startDate?: string | null;
  dueDate?: string | null;
  dueComplete?: boolean;
  coverColor?: string | null;
  coverAttachmentId?: string | null;
};

export type MOVE_CARD_PAYLOAD = {
  cardId: string;
  sourceListId: string;
  destinationListId: string;
  newPosition: number;
};

export type CREATE_LABEL_PAYLOAD = {
  boardId: string;
  name: string;
  color: string;
};

export type ASSIGN_LABEL_PAYLOAD = {
  labelId: string;
};

export type ASSIGN_MEMBER_PAYLOAD = {
  memberId: string;
};

export type CREATE_CHECKLIST_PAYLOAD = {
  title: string;
};

export type CREATE_CHECKLIST_ITEM_PAYLOAD = {
  checklistId: string;
  title: string;
};

export type UPDATE_CHECKLIST_ITEM_PAYLOAD = {
  title?: string;
  isCompleted?: boolean;
};

export type CREATE_COMMENT_PAYLOAD = {
  content: string;
};

export type CARD_SEARCH_RESULT = CARD & {
  list: Pick<LIST, "id" | "boardId" | "title">;
  labels?: LABEL[];
  members?: USER[];
};

export type BOARD_FILTERS = {
  labelId: string | null;
  memberId: string | null;
  dueDate: string | null;
};
