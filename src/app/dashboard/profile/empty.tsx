import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Store, PlusCircle } from "lucide-react";

export default function ProfileEmpty() {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center gap-4 p-8">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
            <Store size={32} />
          </div>

          <h2 className="text-xl font-semibold">
            Create Your Business Profile
          </h2>

          <p className="text-sm text-muted-foreground">
            Add your business details to start billing.
          </p>

          <Link href="/dashboard/profile/create" className="w-full">
            <Button className="w-full gap-2">
              <PlusCircle size={18} />
              Create Business Profile
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
