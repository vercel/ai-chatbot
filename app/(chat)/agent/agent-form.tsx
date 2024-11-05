'use client';

import Form from 'next/form';
import { User } from 'next-auth';

import {
  createAgentAction,
  updateAgentAction,
} from '@/app/(chat)/agent/actions';
import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { type Agent } from '@/db/schema';

interface AgentFormProps {
  user: User;
  agent?: Agent;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const AVAILABLE_TOOLS = [
  { id: 'webSearch', label: 'Web Search' },
  { id: 'dataAnalysis', label: 'Data Analysis' },
  { id: 'codeInterpreter', label: 'Code Interpreter' },
] as const;

export function AgentFormComponent({
  user,
  agent,
  onCancel,
  onSuccess,
}: AgentFormProps) {
  const action = agent
    ? updateAgentAction.bind(null, user.id!, agent.id!)
    : createAgentAction.bind(null, user.id!);
  return (
    <Form action={action}>
      <CardHeader>
        <CardTitle>{agent ? 'Edit Agent' : 'Create New Agent'}</CardTitle>
        <CardDescription>
          {agent
            ? "Update your agent's details below."
            : 'Fill in the details to create a new agent.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input type="hidden" name="id" value={agent?.id} />
        <input type="hidden" name="userId" value={agent?.id} />
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={agent?.name} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={agent?.description ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customInstructions">Custom Instructions</Label>
          <Textarea
            id="customInstructions"
            name="customInstructions"
            defaultValue={agent?.customInstructions ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="aiModel">AI Model</Label>
          <Select name="aiModel" defaultValue={agent?.aiModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select an AI model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* <div className="space-y-2">
          <Label>Activated Tools</Label>
          <div className="grid grid-cols-2 gap-4">
            {AVAILABLE_TOOLS.map((tool) => (
              <div key={tool.id} className="flex items-center space-x-2">
                <Checkbox
                  id={tool.id}
                  name={`activatedTools.${tool.id}`}
                  defaultChecked={agent?.activatedTools[tool.id] || false}
                />
                <Label htmlFor={tool.id}>{tool.label}</Label>
              </div>
            ))}
          </div>
        </div> */}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{agent ? 'Update Agent' : 'Create Agent'}</Button>
      </CardFooter>
    </Form>
  );
}
