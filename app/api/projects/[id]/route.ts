import { auth } from '@/app/(auth)/auth';
import { 
  deleteProject, 
  getProjectById, 
  updateProject 
} from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware, withCorsHeaders } from '../../cors';

export const dynamic = 'force-dynamic'; // Make sure the route is not statically optimized

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get a specific project by ID
 *     description: Returns a project with the specified ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user does not own this project
 *       404:
 *         description: Project not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle OPTIONS request and apply CORS
  const corsResponse = corsMiddleware(request);
  if (corsResponse) return corsResponse;
  
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return withCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const project = await getProjectById({ id: params.id });

    if (!project) {
      return withCorsHeaders(NextResponse.json({ error: 'Project not found' }, { status: 404 }));
    }

    if (project.userId !== session.user.id) {
      return withCorsHeaders(NextResponse.json(
        { error: 'You do not have permission to access this project' },
        { status: 403 }
      ));
    }

    return withCorsHeaders(NextResponse.json(project));
  } catch (error) {
    console.error('Error fetching project:', error);
    return withCorsHeaders(NextResponse.json(
      { error: 'An error occurred while fetching the project' },
      { status: 500 }
    ));
  }
}

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     tags:
 *       - Projects
 *     summary: Update a project
 *     description: Update a project with the given ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Project name
 *               description:
 *                 type: string
 *                 description: Project description
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - no data provided
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user does not own this project
 *       404:
 *         description: Project not found
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle OPTIONS request and apply CORS
  const corsResponse = corsMiddleware(request);
  if (corsResponse) return corsResponse;
  
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return withCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const project = await getProjectById({ id: params.id });

    if (!project) {
      return withCorsHeaders(NextResponse.json({ error: 'Project not found' }, { status: 404 }));
    }

    if (project.userId !== session.user.id) {
      return withCorsHeaders(NextResponse.json(
        { error: 'You do not have permission to modify this project' },
        { status: 403 }
      ));
    }

    const data = await request.json();

    if (!data || (data.name === undefined && data.description === undefined)) {
      return withCorsHeaders(NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      ));
    }

    const success = await updateProject({
      id: params.id,
      name: data.name,
      description: data.description,
    });

    if (!success) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      ));
    }

    return withCorsHeaders(NextResponse.json({ message: 'Project updated successfully' }));
  } catch (error) {
    console.error('Error updating project:', error);
    return withCorsHeaders(NextResponse.json(
      { error: 'An error occurred while updating the project' },
      { status: 500 }
    ));
  }
}

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     tags:
 *       - Projects
 *     summary: Delete a project
 *     description: Delete a project with the given ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user does not own this project
 *       404:
 *         description: Project not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle OPTIONS request and apply CORS
  const corsResponse = corsMiddleware(request);
  if (corsResponse) return corsResponse;
  
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return withCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const project = await getProjectById({ id: params.id });

    if (!project) {
      return withCorsHeaders(NextResponse.json({ error: 'Project not found' }, { status: 404 }));
    }

    if (project.userId !== session.user.id) {
      return withCorsHeaders(NextResponse.json(
        { error: 'You do not have permission to delete this project' },
        { status: 403 }
      ));
    }

    const success = await deleteProject({ id: params.id });

    if (!success) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Failed to delete project' },
        { status: 500 }
      ));
    }

    return withCorsHeaders(NextResponse.json({ message: 'Project deleted successfully' }));
  } catch (error) {
    console.error('Error deleting project:', error);
    return withCorsHeaders(NextResponse.json(
      { error: 'An error occurred while deleting the project' },
      { status: 500 }
    ));
  }
}

// CORS preflight requests are handled by the corsMiddleware function