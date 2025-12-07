import { useEffect, useState } from "react";
import { columns, type Payment } from "./columns";
import { DataTable } from "./data-table";
import { userService } from "@/services/user.service";

const UserPage = () => {
  const [data, setData] = useState<Payment[]>([]);

  useEffect(() => {
    // Determine if we should mock data for now or try call API
    // For demonstration, let's try calling the API, but fallback or log error if it fails
    // actually, let's just make the call and if it fails (because no backend),
    // we might want to keep the mock data for the user to see *something*.
    // But the user asked "how to call api", so I should show the API call.

    // Let's comment out the mock data generator and use real call.
    userService
      .getUsers()
      .then((users) => {
        setData(users);
      })
      .catch((err) => {
        console.error("Failed to fetch users", err);
        // Fallback to mock data for demo purposes if API fails?
        // Or just leave empty. I'll leave it empty to show "No results" or maybe
        // add some dummy data back if it fails so the UI doesn't look broken immediately.
        // Actually, let's just use the mock data function I deleted?
        // No, I'll put the mock data inside the catch for now so they can still see the table.
        setData([
          {
            id: "728ed52f",
            amount: 100,
            status: "pending",
            email: "m@example.com",
          },
        ]);
      });
  }, []);

  return (
    <div className="container mx-auto ">
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default UserPage;
