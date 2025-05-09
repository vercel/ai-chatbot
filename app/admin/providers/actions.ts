'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  getProviders,
  getProviderById,
  updateProvider,
  createProvider,
  getProviderModels,
  createProviderModel,
  updateProviderModel,
} from '@/lib/db/queries';
import { requireAdmin } from '@/lib/rbac/middleware';

// Provider actions
export async function fetchProviders() {
  await requireAdmin();
  return await getProviders();
}

export async function fetchProviderById(providerId: string) {
  await requireAdmin();
  return await getProviderById(providerId);
}

const providerSchema = z.object({
  name: z.string().min(1, 'Provider name is required'),
  slug: z.string().min(1, 'Provider slug is required'),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  enabled: z.boolean().default(true),
});

export type ProviderFormState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
};

export async function saveProvider(
  prevState: ProviderFormState,
  formData: FormData,
): Promise<ProviderFormState> {
  await requireAdmin();

  try {
    const validatedFields = providerSchema.parse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      apiKey: formData.get('apiKey'),
      baseUrl: formData.get('baseUrl'),
      enabled: formData.get('enabled') === 'on',
    });

    const providerId = formData.get('id') as string | null;

    if (providerId) {
      // Update existing provider
      await updateProvider(providerId, validatedFields);
    } else {
      // Create new provider
      await createProvider(
        validatedFields.name,
        validatedFields.slug,
        validatedFields.apiKey,
        validatedFields.baseUrl,
        validatedFields.enabled,
      );
    }

    revalidatePath('/admin/providers');
    return { status: 'success', message: 'Provider saved successfully' };
  } catch (error) {
    console.error('Failed to save provider:', error);
    if (error instanceof z.ZodError) {
      return {
        status: 'error',
        message: error.errors[0].message,
      };
    }
    return {
      status: 'error',
      message: 'Failed to save provider. Please try again.',
    };
  }
}

export async function toggleProviderStatus(
  providerId: string,
  enabled: boolean,
) {
  await requireAdmin();

  try {
    await updateProvider(providerId, { enabled });
    revalidatePath('/admin/providers');
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle provider status:', error);
    return { success: false, error: 'Failed to update provider status' };
  }
}

// Provider Model actions
export async function fetchProviderModels(providerId: string) {
  await requireAdmin();
  return await getProviderModels(providerId);
}

const providerModelSchema = z.object({
  name: z.string().min(1, 'Model name is required'),
  modelId: z.string().min(1, 'Model ID is required'),
  isChat: z.boolean().default(true),
  isImage: z.boolean().default(false),
  enabled: z.boolean().default(true),
  config: z.any().optional(),
});

export type ProviderModelFormState = {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
};

export async function saveProviderModel(
  prevState: ProviderModelFormState,
  formData: FormData,
): Promise<ProviderModelFormState> {
  await requireAdmin();

  try {
    const validatedFields = providerModelSchema.parse({
      name: formData.get('name'),
      modelId: formData.get('modelId'),
      isChat: formData.get('isChat') === 'on',
      isImage: formData.get('isImage') === 'on',
      enabled: formData.get('enabled') === 'on',
      config: formData.get('config')
        ? JSON.parse(formData.get('config') as string)
        : undefined,
    });

    const modelId = formData.get('id') as string | null;
    const providerId = formData.get('providerId') as string;

    if (modelId) {
      // Update existing model
      await updateProviderModel(modelId, validatedFields);
    } else {
      // Create new model
      await createProviderModel(
        providerId,
        validatedFields.name,
        validatedFields.modelId,
        validatedFields.isChat,
        validatedFields.isImage,
        validatedFields.enabled,
        validatedFields.config,
      );
    }

    revalidatePath(`/admin/providers/${providerId}`);
    return { status: 'success', message: 'Model saved successfully' };
  } catch (error) {
    console.error('Failed to save model:', error);
    if (error instanceof z.ZodError) {
      return {
        status: 'error',
        message: error.errors[0].message,
      };
    }
    return {
      status: 'error',
      message: 'Failed to save model. Please try again.',
    };
  }
}

export async function toggleModelStatus(
  modelId: string,
  providerId: string,
  enabled: boolean,
) {
  await requireAdmin();

  try {
    await updateProviderModel(modelId, { enabled });
    revalidatePath(`/admin/providers/${providerId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle model status:', error);
    return { success: false, error: 'Failed to update model status' };
  }
}
