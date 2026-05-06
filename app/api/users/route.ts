import { NextRequest } from 'next/server';
import { apiHandler, ApiContext } from '@/lib/server/api-handler';
import { getUsers } from '@/actions/users'; // adjust path if necessary

async function handler(request: NextRequest, context: ApiContext) {
  const { searchParams } = new URL(request.url);

  // Build filters from query parameters
  const filters = {
    search: searchParams.get('search') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
    role: searchParams.get('role') || undefined,
    is_active: searchParams.has('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    is_verified: searchParams.has('is_verified') ? searchParams.get('is_verified') === 'true' : undefined,
    country: searchParams.get('country') || undefined,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
    with_profile: searchParams.has('with_profile') ? searchParams.get('with_profile') === 'true' : undefined,
    with_permissions: searchParams.has('with_permissions') ? searchParams.get('with_permissions') === 'true' : undefined,
    with_interactions: searchParams.has('with_interactions') ? searchParams.get('with_interactions') === 'true' : undefined,
    with_messages: searchParams.has('with_messages') ? searchParams.get('with_messages') === 'true' : undefined,
  };

  const result = await getUsers(filters);

  return Response.json(result, { status: 200 });
}

export async function GET(request: NextRequest, context: ApiContext) {
  return apiHandler(
    request,
    context,
    handler,
    {
      requireAuth: true, // or false depending on your needs
      requireAppCheck: true,
      allowedMethods: ['GET'],
      rateLimit: {
        windowMs: 60 * 1000,
        max: 60,
      },
    }
  );
}
