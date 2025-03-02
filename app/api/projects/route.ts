import { auth } from '@/app/(auth)/auth';
import { createProject, getProjectsByUserId } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware, withCorsHeaders } from '../cors';

export const dynamic = 'force-dynamic'; // Ensures the route is not statically optimized

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Create a new project
 *     description: Create a new project with the given name and description
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Project name
 *               description:
 *                 type: string
 *                 description: Project description
 *     responses:
 *       201:
 *         description: Project created successfully
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
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - user not authenticated
 */
export async function POST(request: NextRequest) {
  // Handle OPTIONS request and apply CORS
  const corsResponse = corsMiddleware(request);
  if (corsResponse) return corsResponse;
  
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return withCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const { name, description } = await request.json();

    if (!name) {
      return withCorsHeaders(NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      ));
    }

    const project = await createProject({
      name,
      description,
      userId: session.user.id,
    });

    return withCorsHeaders(NextResponse.json(project, { status: 201 }));
  } catch (error) {
    console.error('Error creating project:', error);
    return withCorsHeaders(NextResponse.json(
      { error: 'An error occurred while creating the project' },
      { status: 500 }
    ));
  }
}

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Get all projects for the authenticated user
 *     description: Returns a list of all projects for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized - user not authenticated
 */
export async function GET(request: NextRequest) {
  // Handle OPTIONS request and apply CORS
  const corsResponse = corsMiddleware(request);
  if (corsResponse) return corsResponse;
  
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return withCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
  }

  try {
    const projects = await getProjectsByUserId({ id: session.user.id });
    return withCorsHeaders(NextResponse.json(projects));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return withCorsHeaders(NextResponse.json(
      { error: 'An error occurred while fetching projects' },
      { status: 500 }
    ));
  }
}

// CORS preflight requests are handled by the corsMiddleware function