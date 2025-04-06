'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SendIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SlackIcon from '@/components/icons/slack';
import type { ToolInvocation } from 'ai';
import { useToolExecutionApi } from '@/lib/arcade/hooks/use-tool-execution-api';
type SlackSendDmToUserProps = {
  toolInvocation: ToolInvocation;
  addToolResult: ({
    toolCallId,
    result,
  }: { toolCallId: string; result: any }) => void;
};

// Define the form schema with Zod
const formSchema = z.object({
  user_name: z.string().min(2, {
    message: 'Username must be at least 2 characters.',
  }),
  message: z.string().min(1, {
    message: 'Message cannot be empty.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export const SlackSendDmToUser = ({
  toolInvocation,
  addToolResult,
}: SlackSendDmToUserProps) => {
  const { args } = toolInvocation;

  const { executeTool } = useToolExecutionApi();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_name: args.user_name,
      message: args.message,
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    const result = await executeTool.trigger({
      toolName: 'Slack_SendDmToUser',
      args: values,
    });

    addToolResult({
      toolCallId: toolInvocation.toolCallId,
      result: result,
    });
  };

  // Handle cancel button click
  function handleCancel() {
    addToolResult({
      toolCallId: toolInvocation.toolCallId,
      result: {
        status: 'cancelled',
      },
    });
  }

  return (
    <Card className="w-full max-w-2xl border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 py-4 px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-0">
        <SlackIcon className="size-5" />
        <h3 className="font-semibold text-[#1D1C1D] dark:text-gray-100 text-lg mt-0">
          Send DM to User
        </h3>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-5 bg-white dark:bg-gray-800">
            <FormField
              control={form.control}
              name="user_name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[#1D1C1D] dark:text-gray-100 font-medium">
                    User Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:border-[#4A154B] focus:ring-1 focus:ring-[#4A154B] transition-all"
                    />
                  </FormControl>
                  <FormMessage className="text-[#E01E5A]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[#1D1C1D] dark:text-gray-100 font-medium">
                    Message
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Type your message here..."
                      className="min-h-28 resize-none border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:border-[#4A154B] focus:ring-1 focus:ring-[#4A154B] transition-all"
                    />
                  </FormControl>
                  <FormMessage className="text-[#E01E5A]" />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end px-6 py-4 bg-[#F8F8F8] dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium border-gray-300 dark:border-gray-600 text-[#1D1C1D] dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.formState.isValid}
              className="px-4 py-2 text-sm font-medium bg-[#007a5a] hover:bg-[#006e51] text-white transition-colors"
            >
              <SendIcon className="size-4 mr-1.5" />
              Send
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
