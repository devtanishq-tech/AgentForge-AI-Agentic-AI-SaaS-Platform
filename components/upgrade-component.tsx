"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { getPolarSubscription } from "@/lib/polar/polar_ingestion";

export function UpgradeComponent() {
  const { data: session } = authClient.useSession();
  const { data: subscriptionData, isPending } = useQuery({
    queryKey: ["polar-subscription", session?.user.id],
    queryFn: getPolarSubscription,
    enabled: !!session?.user?.id, // this thing coverts the statement into true or false , check
    // does this thing exist or not ? if not wait then -
  });
  const isProSubscription = subscriptionData?.hasActiveSubscription === true;
  return (
    <>
      {!isProSubscription && !isPending && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <Button
            onClick={async () => {
              await authClient.checkout({
                // Polar Product IDs
                products: ["63c6a229-166c-4e75-8291-a9cbfd429c86"],
                // OR
                // if "products" in passed in the checkout plugin's config, you may pass the slug
                slug: "Pro",
              });
            }}
            variant="default"
            className="rounded-full bg-[#373669] border-[#3e3e4a] text-white hover:bg-[#373669]/60 text-[12px] h-8 px-4 font-medium"
          >
            ✦ Get Plus
          </Button>
        </div>
      )}
    </>
  );
}
