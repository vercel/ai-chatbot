import { Payment, columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
        id: "728ed52f",
        amount: 100,
        status: "pending",
        email: "m@example.com"
    },
    {
        id: "b47cde3a",
        amount: 250,
        status: "pending",
        email: "john.doe@example.com"
    },
    {
        id: "f1a3b4c8",
        amount: 150,
        status: "pending",
        email: "alice.smith@example.com"
    },
    {
        id: "a2d6e8f7",
        amount: 300,
        status: "pending",
        email: "bob.jones@example.com"
    },
    {
        id: "c4e2f6d1",
        amount: 200,
        status: "pending",
        email: "charlie.brown@example.com"
    },
    {
        id: "e8d2a5b3",
        amount: 500,
        status: "pending",
        email: "david.johnson@example.com"
    },
    {
        id: "f9b2c4a1",
        amount: 400,
        status: "pending",
        email: "eva.green@example.com"
    },
    {
        id: "d6c3e8b4",
        amount: 350,
        status: "pending",
        email: "frank.harris@example.com"
    },
    {
        id: "b7d4e6f2",
        amount: 450,
        status: "pending",
        email: "george.wilson@example.com"
    },
    {
        id: "c9a5b2d1",
        amount: 600,
        status: "pending",
        email: "hannah.white@example.com"
    }
];

}

export default async function DemoPage() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
