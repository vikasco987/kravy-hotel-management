import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEffectiveClerkId } from '@/lib/auth-utils';

export async function PUT(request: Request) {
    try {
        const effectiveId = await getEffectiveClerkId();
        if (!effectiveId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { googleReviewUrl } = body;

        // Find the user's business profile
        const profile = await prisma.businessProfile.findFirst({
            where: { userId: effectiveId }
        });

        if (!profile) {
            return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
        }

        // Update the googleReviewUrl
        const updatedProfile = await prisma.businessProfile.update({
            where: { id: profile.id },
            data: { googleReviewUrl }
        });

        return NextResponse.json({ success: true, googleReviewUrl: updatedProfile.googleReviewUrl });

    } catch (error) {
        console.error("Error updating googleReviewUrl:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
