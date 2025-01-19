import Form from "next/form";

export function GithubAuthFormTest({
  action,
  children,
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
}) {
  return (
    <Form action={action} className="flex flex-col gap-4 px-4 sm:px-16">
      {children}
    </Form>
  );
}
