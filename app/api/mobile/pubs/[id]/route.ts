import { getMobileAdvertisementById } from "@/actions/mobile/advertisements";
import { publicHandler, ApiContext } from "@/lib/api-handler";
import { NextRequest } from "next/server";

//api/pubs/[id]
export const GET = publicHandler(async (request: NextRequest, context: ApiContext) => {
    const { id, userId } = await context.params!;
    const idNumber = parseInt(id);
    const userIdNumber = userId ? parseInt(userId) : undefined;
    if (userIdNumber && (isNaN(userIdNumber) || userIdNumber <= 0)) {
        return Response.json({
            success: false,
            error: {
                code: 400,
                message: 'Le paramètre userId est requis et doit être un nombre valide',
                timestamp: new Date().toISOString()
            }
        }, { status: 400 });
    }

    const result = await getMobileAdvertisementById(idNumber, userIdNumber);

    if (!result) {
        return Response.json(result, {
            status: (result as any).error?.code || 500
        });
    }

    return Response.json(result);
}, ['GET']);