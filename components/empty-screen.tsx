export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">Explore SuperBrain®</h1>
        <p className="leading-normal text-muted-foreground">
          Our system is securely connect your organisational data. Ask anything
          to our chatbot and you may get responses based on the permissions
          allocated.
        </p>
        <p className="leading-normal text-muted-foreground">
          Beware that you cannot access the data outside of your permissions,
          hence such requests are not entertained.
        </p>
      </div>
    </div>
  )
}
