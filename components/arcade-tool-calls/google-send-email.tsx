'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChevronDownIcon, ChevronUpIcon, SendIcon } from 'lucide-react';
import { useState } from 'react';

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
import GoogleIcon from '@/components/icons/google';
import type { ToolInvocation } from 'ai';
import { useToolExecutionApi } from '@/lib/arcade/hooks/use-tool-execution-api';

type GoogleSendEmailProps = {
  toolInvocation: ToolInvocation;
  addToolResult: ({
    toolCallId,
    result,
  }: { toolCallId: string; result: any }) => void;
};

// Define the form schema with Zod
const formSchema = z.object({
  subject: z.string().min(1, {
    message: 'Subject cannot be empty.',
  }),
  body: z.string().min(1, {
    message: 'Body cannot be empty.',
  }),
  recipient: z.string().min(1, {
    message: 'Recipient cannot be empty.',
  }),
  cc: z.string().optional(),
  bcc: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const GoogleSendEmail = ({
  toolInvocation,
  addToolResult,
}: GoogleSendEmailProps) => {
  const { args } = toolInvocation;
  const { executeTool } = useToolExecutionApi();
  const [showCcBcc, setShowCcBcc] = useState(!!args.cc || !!args.bcc);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: args.subject,
      body: args.body,
      recipient: args.recipient,
      cc: args.cc || '',
      bcc: args.bcc || '',
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    const result = await executeTool.trigger({
      toolName: 'Google_SendEmail',
      args: {
        ...values,
        cc: values.cc ? values.cc.split(',').map((email) => email.trim()) : [],
        bcc: values.bcc
          ? values.bcc.split(',').map((email) => email.trim())
          : [],
      },
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
        <GoogleIcon className="size-5" />
        <h3 className="font-semibold text-[#1D1C1D] dark:text-gray-100 text-lg mt-0">
          Send Email
        </h3>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-5 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between gap-4">
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-[#1D1C1D] dark:text-gray-100 font-medium">
                      To
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all"
                      />
                    </FormControl>
                    <FormMessage className="text-[#EA4335]" />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="link"
                onClick={() => setShowCcBcc(!showCcBcc)}
                className="self-end"
              >
                <>
                  {showCcBcc ? (
                    <ChevronUpIcon className="size-4" />
                  ) : (
                    <ChevronDownIcon className="size-4" />
                  )}
                  Cc/Bcc
                </>
              </Button>
            </div>

            {showCcBcc && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="cc"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[#1D1C1D] dark:text-gray-100 font-medium">
                        Cc
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Comma separated email addresses"
                          className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all"
                        />
                      </FormControl>
                      <FormMessage className="text-[#EA4335]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bcc"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[#1D1C1D] dark:text-gray-100 font-medium">
                        Bcc
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Comma separated email addresses"
                          className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all"
                        />
                      </FormControl>
                      <FormMessage className="text-[#EA4335]" />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[#1D1C1D] dark:text-gray-100 font-medium">
                    Subject
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all"
                    />
                  </FormControl>
                  <FormMessage className="text-[#EA4335]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-[#1D1C1D] dark:text-gray-100 font-medium">
                    Message
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Type your message here..."
                      className="min-h-28 resize-none border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md focus:border-[#4285F4] focus:ring-1 focus:ring-[#4285F4] transition-all"
                    />
                  </FormControl>
                  <FormMessage className="text-[#EA4335]" />
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
              className="px-4 py-2 text-sm font-medium bg-[#4285F4] hover:bg-[#3367D6] text-white transition-colors"
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
