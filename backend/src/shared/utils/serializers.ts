export const sanitizeUser = <T extends { passwordHash?: string }>(
  user: T,
): Omit<T, "passwordHash"> => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

export const toMemberResponse = (user: {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl ?? undefined,
});

export const toCardResponse = (card: {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  dueComplete: boolean;
  coverColor: string | null;
  coverAttachmentId: string | null;
  position: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: card.id,
  listId: card.listId,
  title: card.title,
  description: card.description ?? undefined,
  startDate: card.startDate?.toISOString(),
  dueDate: card.dueDate?.toISOString(),
  dueComplete: card.dueComplete,
  coverColor: card.coverColor ?? undefined,
  coverAttachmentId: card.coverAttachmentId ?? undefined,
  position: card.position,
  status: card.status,
  createdAt: card.createdAt,
  updatedAt: card.updatedAt,
});

export const toLabelResponse = (label: {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: label.id,
  boardId: label.boardId,
  name: label.name,
  color: label.color,
  createdAt: label.createdAt,
  updatedAt: label.updatedAt,
});

export const toChecklistItemResponse = (item: {
  id: string;
  checklistId: string;
  title: string;
  isCompleted: boolean;
  position: number;
  dueDate: Date | null;
  createdAt: Date;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}) => ({
  id: item.id,
  checklistId: item.checklistId,
  title: item.title,
  isCompleted: item.isCompleted,
  position: item.position,
  dueDate: item.dueDate?.toISOString(),
  createdAt: item.createdAt,
  assignedTo: item.assignedTo ? toMemberResponse(item.assignedTo) : undefined,
});

export const toCommentResponse = (comment: {
  id: string;
  cardId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}) => ({
  id: comment.id,
  cardId: comment.cardId,
  content: comment.content,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  user: toMemberResponse(comment.user),
});

export const toAttachmentResponse = (attachment: {
  id: string;
  cardId: string;
  kind: string;
  url: string;
  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: Date;
}) => ({
  id: attachment.id,
  cardId: attachment.cardId,
  kind: attachment.kind,
  url: attachment.url,
  filename: attachment.filename ?? undefined,
  mimeType: attachment.mimeType ?? undefined,
  sizeBytes: attachment.sizeBytes ?? undefined,
  createdAt: attachment.createdAt,
});

export const toBoardMemberResponse = (member: {
  userId: string;
  role: string;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}) => ({
  userId: member.userId,
  role: member.role,
  joinedAt: member.joinedAt,
  user: toMemberResponse(member.user),
});
