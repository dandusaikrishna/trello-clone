import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/shared/utils/password.js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { LABEL_COLORS } from "../src/shared/constants/index.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const users = [
  {
    name: "Swaroop",
    email: "saidandu92@gmail.com",
    password: "123456",
  },
  { name: "John", email: "john@example.com", password: "password123" },
  { name: "Alice", email: "alice@example.com", password: "password123" },
];

const listTitles = ["Todo", "In Progress", "Review", "Done"];

const labelDefinitions = [
  { name: "Bug", color: LABEL_COLORS[3]! },
  { name: "Feature", color: LABEL_COLORS[0]! },
  { name: "Review", color: LABEL_COLORS[1]! },
  { name: "High Priority", color: LABEL_COLORS[2]! },
];

const cardDefinitions = [
  { title: "Setup Backend", listIndex: 0 },
  { title: "Implement Login", listIndex: 1 },
  { title: "Create Drag Drop", listIndex: 2 },
  { title: "Deploy Application", listIndex: 3 },
];

async function main() {
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.cardLabel.deleteMany();
  await prisma.cardMember.deleteMany();
  await prisma.card.deleteMany();
  await prisma.list.deleteMany();
  await prisma.label.deleteMany();
  await prisma.boardStar.deleteMany();
  await prisma.boardMember.deleteMany();
  await prisma.board.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await Promise.all(
    users.map(async (user) =>
      prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash: await hashPassword(user.password),
        },
      }),
    ),
  );

  const owner = createdUsers[0]!;

  const workspace = await prisma.workspace.create({
    data: {
      name: "Personal",
      slug: "personal",
      members: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: createdUsers[1]!.id, role: "MEMBER" },
          { userId: createdUsers[2]!.id, role: "MEMBER" },
        ],
      },
    },
  });

  const board = await prisma.board.create({
    data: {
      title: "Personal Project",
      ownerId: owner.id,
      workspaceId: workspace.id,
      visibility: "WORKSPACE",
      backgroundColor: "#0079bf",
      members: {
        create: [
          { userId: owner.id, role: "ADMIN" },
          { userId: createdUsers[1]!.id, role: "MEMBER" },
        ],
      },
    },
  });

  await prisma.boardStar.create({
    data: {
      userId: owner.id,
      boardId: board.id,
    },
  });

  const lists = await Promise.all(
    listTitles.map((title, index) =>
      prisma.list.create({
        data: {
          boardId: board.id,
          title,
          position: index + 1,
        },
      }),
    ),
  );

  const labels = await Promise.all(
    labelDefinitions.map((label) =>
      prisma.label.create({
        data: {
          boardId: board.id,
          name: label.name,
          color: label.color,
        },
      }),
    ),
  );

  const cards = await Promise.all(
    cardDefinitions.map((card, index) =>
      prisma.card.create({
        data: {
          listId: lists[card.listIndex]!.id,
          title: card.title,
          position: index + 1,
          description: `Sample card: ${card.title}`,
          startDate: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ),
  );

  await prisma.cardLabel.create({
    data: {
      cardId: cards[0]!.id,
      labelId: labels[0]!.id,
    },
  });

  await prisma.cardLabel.create({
    data: {
      cardId: cards[1]!.id,
      labelId: labels[1]!.id,
    },
  });

  await prisma.cardMember.create({
    data: {
      cardId: cards[1]!.id,
      userId: createdUsers[1]!.id,
    },
  });

  const checklist = await prisma.checklist.create({
    data: {
      cardId: cards[1]!.id,
      title: "Implementation Tasks",
    },
  });

  await prisma.checklistItem.createMany({
    data: [
      {
        checklistId: checklist.id,
        title: "Create route",
        position: 1,
        isCompleted: true,
        assignedToId: createdUsers[1]!.id,
      },
      {
        checklistId: checklist.id,
        title: "Add validation",
        position: 2,
        isCompleted: false,
      },
      {
        checklistId: checklist.id,
        title: "Write tests",
        position: 3,
        isCompleted: false,
      },
    ],
  });

  const attachment = await prisma.attachment.create({
    data: {
      cardId: cards[0]!.id,
      kind: "LINK",
      url: "https://example.com/spec.pdf",
      filename: "spec.pdf",
      uploadedById: owner.id,
    },
  });

  await prisma.comment.create({
    data: {
      cardId: cards[1]!.id,
      userId: owner.id,
      content: "Let's ship this by end of week!",
    },
  });

  await prisma.activity.createMany({
    data: [
      {
        boardId: board.id,
        userId: owner.id,
        type: "WORKSPACE_CREATED",
        message: `Workspace "${workspace.name}" was seeded`,
        metadata: { workspaceId: workspace.id },
      },
      {
        boardId: board.id,
        userId: owner.id,
        type: "BOARD_CREATED",
        message: `Board "${board.title}" was seeded`,
      },
      {
        boardId: board.id,
        cardId: cards[0]!.id,
        userId: owner.id,
        type: "ATTACHMENT_ADDED",
        message: `Attachment added to "${cards[0]!.title}"`,
        metadata: { attachmentId: attachment.id },
      },
    ],
  });

  console.log("Database seeded successfully");
  console.log("Login with saidandu92@gmail.com / 123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
