import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

function serializeData<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, val: unknown) =>
      typeof val === "bigint" ? val.toString() : val
    )
  );
}

async function isAdminUser(userId: bigint): Promise<boolean> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.some(
    (userRole) => userRole.role.roleName?.toUpperCase() === "ADMIN"
  );
}

function isPrismaNotFoundError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2025"
  );
}

function parseNotificationId(value: unknown): bigint | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return BigInt(value.trim());
  }
  return null;
}

const NOTIFICATION_SELECT = {
  notification_id: true,
  user_id: true,
  title: true,
  message: true,
  notification_type: true,
  is_read: true,
  created_at: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = ["true", "1"].includes(
      (searchParams.get("unread") ?? "").toLowerCase()
    );

    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: user.userId,
        ...(unreadOnly ? { is_read: false } : {}),
      },
      select: NOTIFICATION_SELECT,
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ success: true, data: serializeData(notifications) });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser(user.userId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Only admins can send notifications" },
        { status: 403 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const targetUserId = parseNotificationId(body.userId);
    if (targetUserId === null) {
      return NextResponse.json(
        { success: false, error: "A valid userId is required" },
        { status: 400 }
      );
    }

    const title =
      typeof body.title === "string" ? body.title.trim().slice(0, 255) : "";
    if (!title) {
      return NextResponse.json(
        { success: false, error: "title is required" },
        { status: 400 }
      );
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json(
        { success: false, error: "message is required" },
        { status: 400 }
      );
    }

    let notificationType: string | null = null;
    if (body.notificationType !== undefined && body.notificationType !== null) {
      if (typeof body.notificationType !== "string" || !body.notificationType.trim()) {
        return NextResponse.json(
          { success: false, error: "notificationType must be a non-empty string" },
          { status: 400 }
        );
      }
      notificationType = body.notificationType.trim().slice(0, 50);
    }

    const targetUser = await prisma.user.findUnique({ where: { userId: targetUserId } });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Target user not found" },
        { status: 404 }
      );
    }

    const notification = await prisma.notifications.create({
      data: {
        user_id: targetUserId,
        title,
        message,
        notification_type: notificationType,
        is_read: false,
      },
      select: NOTIFICATION_SELECT,
    });

    return NextResponse.json(
      { success: true, data: serializeData(notification) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const notificationId = parseNotificationId(body.notificationId ?? body.id);
    if (notificationId === null) {
      return NextResponse.json(
        { success: false, error: "A valid notificationId is required" },
        { status: 400 }
      );
    }

    let isRead = true;
    if (body.isRead !== undefined || body.is_read !== undefined) {
      const rawIsRead = body.isRead ?? body.is_read;
      if (typeof rawIsRead === "boolean") {
        isRead = rawIsRead;
      } else if (rawIsRead === "true") {
        isRead = true;
      } else if (rawIsRead === "false") {
        isRead = false;
      } else {
        return NextResponse.json(
          { success: false, error: "isRead must be a boolean" },
          { status: 400 }
        );
      }
    }

    const notification = await prisma.notifications.findUnique({
      where: { notification_id: notificationId },
    });
    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.user_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: "You can only update your own notifications" },
        { status: 403 }
      );
    }

    const updated = await prisma.notifications.update({
      where: { notification_id: notificationId },
      data: { is_read: isRead },
      select: NOTIFICATION_SELECT,
    });

    return NextResponse.json({ success: true, data: serializeData(updated) });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const { searchParams } = new URL(request.url);
    const rawId =
      body.notificationId ?? searchParams.get("notificationId") ?? searchParams.get("id");
    const notificationId = parseNotificationId(rawId);
    if (notificationId === null) {
      return NextResponse.json(
        { success: false, error: "A valid notificationId is required" },
        { status: 400 }
      );
    }

    const notification = await prisma.notifications.findUnique({
      where: { notification_id: notificationId },
    });
    if (!notification) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    const admin = await isAdminUser(user.userId);
    if (!admin && notification.user_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own notifications" },
        { status: 403 }
      );
    }

    await prisma.notifications.delete({ where: { notification_id: notificationId } });

    return NextResponse.json({
      success: true,
      data: { message: "Notification deleted", notification_id: notificationId.toString() },
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
