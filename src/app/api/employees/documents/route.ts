import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromRequest,
  isAdminUser,
  isPrismaNotFoundError,
  serializeData,
} from "@/lib/auth";

function parseDocumentId(value: unknown): bigint | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return BigInt(value.trim());
  }
  return null;
}

async function resolveEmployeeByPublicId(publicEmployeeId: string) {
  const targetUser = await prisma.user.findUnique({
    where: { employeeId: publicEmployeeId },
  });
  if (!targetUser) return null;
  return prisma.employee.findUnique({ where: { userId: targetUser.userId } });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const admin = await isAdminUser(user.userId);
    const whereClause: Record<string, unknown> = {};

    if (admin) {
      const { searchParams } = new URL(request.url);
      const employeeIdParam = searchParams.get("employeeId");
      if (employeeIdParam) {
        const employee = await resolveEmployeeByPublicId(employeeIdParam);
        if (!employee) {
          return NextResponse.json(
            { success: false, error: "Employee not found" },
            { status: 404 }
          );
        }
        whereClause.employeeId = employee.employeeId;
      }
    } else {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.userId },
      });
      if (!employee) {
        return NextResponse.json(
          { success: false, error: "Employee profile not found" },
          { status: 404 }
        );
      }
      whereClause.employeeId = employee.employeeId;
    }

    const documents = await prisma.employeeDocument.findMany({
      where: whereClause,
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: serializeData(documents) });
  } catch (error) {
    console.error("Error fetching employee documents:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch documents" },
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

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const documentType =
      typeof body.documentType === "string" ? body.documentType.trim().slice(0, 50) : "";
    const documentName =
      typeof body.documentName === "string" ? body.documentName.trim().slice(0, 255) : "";
    const documentUrl = typeof body.documentUrl === "string" ? body.documentUrl.trim() : "";

    if (!documentType || !documentName || !documentUrl) {
      return NextResponse.json(
        { success: false, error: "documentType, documentName, and documentUrl are required" },
        { status: 400 }
      );
    }

    const requestedEmployeeId =
      typeof body.employeeId === "string" && body.employeeId.trim()
        ? body.employeeId.trim()
        : null;

    const admin = await isAdminUser(user.userId);

    let employeeRecord;
    if (requestedEmployeeId) {
      if (!admin) {
        const ownProfile = await prisma.employee.findUnique({
          where: { userId: user.userId },
          include: { user: { select: { employeeId: true } } },
        });
        if (!ownProfile || ownProfile.user?.employeeId !== requestedEmployeeId) {
          return NextResponse.json(
            { success: false, error: "You can only add documents to your own profile" },
            { status: 403 }
          );
        }
        employeeRecord = ownProfile;
      } else {
        employeeRecord = await resolveEmployeeByPublicId(requestedEmployeeId);
        if (!employeeRecord) {
          return NextResponse.json(
            { success: false, error: "Employee not found" },
            { status: 404 }
          );
        }
      }
    } else {
      if (admin) {
        return NextResponse.json(
          { success: false, error: "employeeId is required" },
          { status: 400 }
        );
      }
      employeeRecord = await prisma.employee.findUnique({
        where: { userId: user.userId },
      });
      if (!employeeRecord) {
        return NextResponse.json(
          { success: false, error: "Employee profile not found" },
          { status: 404 }
        );
      }
    }

    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: employeeRecord.employeeId,
        documentType,
        documentName,
        documentUrl,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json(
      { success: true, data: serializeData(document) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating employee document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create document" },
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
      body.documentId ?? searchParams.get("documentId") ?? searchParams.get("id");
    const documentId = parseDocumentId(rawId);
    if (documentId === null) {
      return NextResponse.json(
        { success: false, error: "A valid documentId is required" },
        { status: 400 }
      );
    }

    const document = await prisma.employeeDocument.findUnique({
      where: { documentId },
    });
    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    const admin = await isAdminUser(user.userId);
    if (!admin) {
      const employee = await prisma.employee.findUnique({
        where: { userId: user.userId },
      });
      if (!employee || employee.employeeId !== document.employeeId) {
        return NextResponse.json(
          { success: false, error: "You can only delete your own documents" },
          { status: 403 }
        );
      }
    }

    await prisma.employeeDocument.delete({ where: { documentId } });

    return NextResponse.json({
      success: true,
      data: { message: "Document deleted", documentId: documentId.toString() },
    });
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting employee document:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
