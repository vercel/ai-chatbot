'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from './toast';

interface Persona {
  id: string;
  name: string;
  systemMessage: string | null;
  persona: string | null;
}

// Default assistant persona
const DEFAULT_PERSONA: Persona = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Default Assistant',
  systemMessage: 'You are a helpful AI assistant.',
  persona: 'You are a motivated person who talks clearly and directly.',
};

const personaFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'Persona name must be at least 2 characters.',
    })
    .max(64, {
      message: 'Persona name must not exceed 64 characters.',
    }),
  systemMessage: z.string().optional(),
  persona: z.string().optional(),
});

type PersonaForm = z.infer<typeof personaFormSchema>;

export function ProfilePersonaManager() {
  const [userPersona, setUserPersona] = useState<Persona>(DEFAULT_PERSONA);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch the user's persona on component mount
  useEffect(() => {
    const fetchPersona = async () => {
      try {
        const response = await fetch('/api/profile/persona');
        if (!response.ok) throw new Error('Failed to fetch persona');

        const data = await response.json();
        if (data.personas && data.personas.length > 0) {
          setUserPersona(data.personas[0]);
        }
      } catch (error) {
        console.error('Error fetching persona:', error);
        toast({
          type: 'error',
          description: 'Failed to load persona data',
        });
      }
    };

    fetchPersona();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<PersonaForm>({
    resolver: zodResolver(personaFormSchema) as any,
    defaultValues: {
      name: '',
      systemMessage: '',
      persona: '',
    },
  });

  async function onSubmit(data: PersonaForm) {
    setIsLoading(true);

    try {
      // If we already have a persona, update it
      if (userPersona.id && userPersona.id !== DEFAULT_PERSONA.id) {
        const response = await fetch('/api/profile/persona', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: userPersona.id,
            name: data.name,
            systemMessage: data.systemMessage,
            persona: data.persona,
          }),
        });

        if (!response.ok) throw new Error('Failed to update persona');

        const result = await response.json();
        setUserPersona(result.persona[0]);
      } else {
        // Create a new persona
        const response = await fetch('/api/profile/persona', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            systemMessage: data.systemMessage,
            persona: data.persona,
          }),
        });

        if (!response.ok) throw new Error('Failed to create persona');

        const result = await response.json();
        setUserPersona(result.persona[0]);
      }

      reset();
      setIsEditing(false);
      toast({
        type: 'success',
        description: 'Persona saved to database successfully',
      });
    } catch (error) {
      console.error('Error saving persona:', error);
      toast({
        type: 'error',
        description: 'Failed to save persona',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function startEditing() {
    setValue('name', userPersona.name);
    setValue('systemMessage', userPersona.systemMessage || '');
    setValue('persona', userPersona.persona || '');
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    reset();
  }

  // If we're in edit mode, show the form
  const showForm = isEditing;

  return (
    <div className="p-6 border rounded-lg bg-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">AI Persona</h3>
        {!showForm && (
          <Button onClick={() => startEditing()}>Edit Persona</Button>
        )}
      </div>

      {showForm ? (
        <div className="mb-6 p-4 border rounded-md">
          <h4 className="text-lg font-medium mb-4">Edit Persona</h4>

          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Persona Name</Label>
              <Input
                id="name"
                placeholder="My Assistant"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemMessage">
                System Message (what the AI knows/does)
              </Label>
              <Textarea
                id="systemMessage"
                placeholder="You are a manager at an accounting software company..."
                rows={5}
                {...register('systemMessage')}
              />
              {errors.systemMessage && (
                <p className="text-sm text-red-500">
                  {errors.systemMessage.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="persona">
                Persona Style (how the AI communicates)
              </Label>
              <Textarea
                id="persona"
                placeholder="You are a motivated person who talks like Grant Cardone..."
                rows={5}
                {...register('persona')}
              />
              {errors.persona && (
                <p className="text-sm text-red-500">{errors.persona.message}</p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Update Persona'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 border rounded-md">
            <h5 className="font-medium text-lg mb-2">{userPersona.name}</h5>

            <div className="mb-4">
              <h6 className="text-sm font-medium text-muted-foreground mb-1">
                System Message:
              </h6>
              <p className="text-sm p-2 bg-muted rounded">
                {userPersona.systemMessage || 'No system message defined'}
              </p>
            </div>

            <div>
              <h6 className="text-sm font-medium text-muted-foreground mb-1">
                Persona Style:
              </h6>
              <p className="text-sm p-2 bg-muted rounded">
                {userPersona.persona || 'No persona style defined'}
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>
              Your AI will use this persona for all conversations. The system
              message defines what the AI knows or does, while the persona style
              defines how it communicates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
