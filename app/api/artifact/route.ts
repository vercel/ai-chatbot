/**
 * @file app/api/artifact/route.ts
 * @description API маршрут для работы с артефактами.
 * @version 1.3.0
 * @date 2025-06-12
 * @updated Added versionTimestamp support for single-version retrieval.
 */

/** HISTORY:
 * v1.3.0 (2025-06-12): GET endpoint accepts versionTimestamp.
 * v1.2.0 (2025-06-10): Импорт ArtifactKind из lib/types.
 * v1.1.0 (2025-06-09): Исправлены типы ошибок и логика для соответствия новой схеме.
 * v1.0.0 (2025-06-09): Переименован из document, адаптирован под новую схему и логику.
 */

import { auth } from '@/app/app/(auth)/auth'
import { deleteArtifactVersionsAfterTimestamp, getArtifactsById, getArtifactById, saveArtifact, } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ

export async function GET (request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const versionParam = searchParams.get('version')
  const versionTimestampParam = searchParams.get('versionTimestamp')

  if (!id) {
    return new ChatSDKError('bad_request:api', 'Parameter id is missing').toResponse()
  }

  const session = await auth()
  if (!session?.user) {
    return new ChatSDKError('unauthorized:artifact').toResponse()
  }

  if (versionParam || versionTimestampParam) {
    const version = versionParam ? Number.parseInt(versionParam, 10) : undefined
    const versionTimestamp = versionTimestampParam ? new Date(versionTimestampParam) : undefined
    const result = await getArtifactById({ id, version, versionTimestamp })
    if (!result) {
      return new ChatSDKError('not_found:artifact').toResponse()
    }
    if (result.doc.userId !== session.user.id) {
      return new ChatSDKError('forbidden:artifact').toResponse()
    }
    return Response.json(result, { status: 200 })
  }

  const artifacts = await getArtifactsById({ id })
  const [artifact] = artifacts

  if (!artifact) {
    return new ChatSDKError('not_found:artifact').toResponse()
  }

  if (artifact.userId !== session.user.id) {
    return new ChatSDKError('forbidden:artifact').toResponse()
  }

  return Response.json(artifacts, { status: 200 })
}

export async function POST (request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return new ChatSDKError('bad_request:api', 'Parameter id is required.').toResponse()
  }

  const session = await auth()
  if (!session?.user) {
    return new ChatSDKError('unauthorized:artifact').toResponse()
  }

  const { content, title, kind, }: { content: string; title: string; kind: ArtifactKind } = await request.json()

  const artifacts = await getArtifactsById({ id })
  if (artifacts.length > 0) {
    const [artifact] = artifacts
    if (artifact.userId !== session.user.id) {
      return new ChatSDKError('forbidden:artifact').toResponse()
    }
  }

  const artifact = await saveArtifact({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
    authorId: session.user.id,
  })

  return Response.json(artifact, { status: 200 })
}

export async function DELETE (request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const timestamp = searchParams.get('timestamp')

  if (!id) {
    return new ChatSDKError('bad_request:api', 'Parameter id is required.').toResponse()
  }
  if (!timestamp) {
    return new ChatSDKError('bad_request:api', 'Parameter timestamp is required.').toResponse()
  }

  const session = await auth()
  if (!session?.user) {
    return new ChatSDKError('unauthorized:artifact').toResponse()
  }

  const artifacts = await getArtifactsById({ id })
  const [artifact] = artifacts

  if (artifact.userId !== session.user.id) {
    return new ChatSDKError('forbidden:artifact').toResponse()
  }

  const deletedArtifacts = await deleteArtifactVersionsAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  })

  return Response.json(deletedArtifacts, { status: 200 })
}

// END OF: app/api/artifact/route.ts
