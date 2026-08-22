import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getUserRoles, serializeData } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const roles = await getUserRoles(user.userId);
    const role = roles.includes("ADMIN") ? "ADMIN" : "EMPLOYEE";

    return NextResponse.json({
      success: true,
      data: serializeData({
        id: user.userId,
        employeeId: user.employeeId,
        email: user.email,
        role,
        roles,
        employee: user.employee,
      }),
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
