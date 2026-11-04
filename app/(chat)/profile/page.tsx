"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CalendarDays, ShieldCheck, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import {
  getPolarEvent,
  getPolarMeters,
  getPolarSubscription,
} from "@/lib/polar/polar_ingestion";

export default function ChatbotUserProfile() {
  // ── Static user data (replace with auth session later) ──
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  //===========tanstack query for getsubscription /.================
  const {
    data: subscriptionData,
    isPending: isSubscriptionPending,
    isError: isSubscriptionError,
  } = useQuery({
    queryKey: ["polar-subscription", session?.user.id],
    queryFn: getPolarSubscription,
    enabled: !!session?.user?.id, // this thing coverts the statement into true or false , check
    // does this thing exist or not ? if not wait then -
  });
  const isProSubscription = subscriptionData?.hasActiveSubscription === true;
  //======================customer -meter tanstack query =====================
  const {
    data: usageData,
    isPending: isUsagePending,
    isError: isUsageError,
    refetch: refetchUsuage,
  } = useQuery({
    queryKey: ["customer-meters"],
    queryFn: () => {
      return getPolarMeters();
    },
    enabled:
      !!session?.user.id && subscriptionData?.hasActiveSubscription === true,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });
  //========================Polar event -tanstack query //===================
  const { data: modelName, isPending } = useQuery({
    queryKey: ["polar-event", session?.user.id],
    queryFn: getPolarEvent,
  });

  //======================Need to Loading UI there ==========================
  if (isSessionPending) {
    return <div>Loading your profile...</div>;
  }

  if (!session) {
    return <div>Please log in to view your profile.</div>;
  }

  if (isSubscriptionPending) {
    return <div>Checking your subscription...</div>;
  }

  if (isSubscriptionError || !subscriptionData) {
    return <div>Unable to load subscription information.</div>;
  }

  const user = session.user;

  const usagePercent =
    usageData && usageData.creditedUnits > 0
      ? (usageData.consumedUnits / usageData.creditedUnits) * 100
      : 0;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-4">
      {/* Profile Header */}
      <Card className="rounded-2xl border shadow-sm">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-24 w-24 rounded-2xl">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="rounded-2xl text-lg">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                {user.name}
              </h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex items-center gap-3 pt-1">
                <Badge variant="secondary" className="rounded-xl">
                  {"user"}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-xl flex items-center gap-1"
                >
                  <ShieldCheck className="h-3 w-3" />{" "}
                  {isProSubscription ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {isProSubscription ? (
              <Button className="bg-[#373669] border-[#3e3e4a] text-white hover:bg-[#373669]/90 text-[12px] font-medium">
                <Sparkles />
                Pro Member
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  await authClient.checkout({
                    // Polar Product IDs
                    // products: ["63c6a229-166c-4e75-8291-a9cbfd429c86"],
                    // OR
                    // if "products" in passed in the checkout plugin's config, you may pass the slug
                    slug: "Pro",
                  });
                }}
              >
                <Sparkles />
                Upgrade to Pro
              </Button>
            )}

            <Button
              variant="outline"
              className="rounded-xl"
              onClick={async () => {
                await authClient.customer.portal();
              }}
            >
              Manage Billing
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription & Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Details */}
        <Card className="rounded-2xl border shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Subscription</CardTitle>
            <CardDescription>Current plan and renewal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge className="rounded-xl">
                {isProSubscription ? modelName : "Inactive"}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" /> Purchased
                </div>
                <span>
                  {subscriptionData.subscription?.startedAt
                    ? new Date(
                        subscriptionData.subscription.startedAt,
                      ).toLocaleDateString()
                    : "Not subscribed"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Overview */}

        {/* Usage Overview / Upgrade UI */}

        {isProSubscription ? (
          isUsagePending ? (
            <Card className="rounded-2xl border shadow-sm lg:col-span-2">
              <CardContent className="p-6">Loading token usage...</CardContent>
            </Card>
          ) : isUsageError || !usageData ? (
            <Card className="rounded-2xl border shadow-sm lg:col-span-2">
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold">Token usage unavailable</h3>
                <p className="text-sm text-muted-foreground">
                  Your subscription is active, but usage data is not available
                  yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Token Usage</CardTitle>
                <CardDescription>
                  Monthly AI consumption overview
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-2xl bg-muted/40 border">
                    <p className="text-sm text-muted-foreground">
                      Credited Units
                    </p>
                    <p className="text-xl font-semibold pt-2">
                      {usageData.creditedUnits.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border">
                    <p className="text-sm text-muted-foreground">
                      Current Usage
                    </p>
                    <p className="text-xl font-semibold pt-2">
                      {usageData.consumedUnits.toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-xl font-semibold pt-2">
                      {usageData.balance.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Progress
                    value={Math.min(100, Math.max(0, usagePercent))}
                    className="h-3 rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground">
                    {usagePercent.toFixed(1)}% of credited units used
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="rounded-2xl border shadow-sm lg:col-span-2">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="rounded-full bg-[#373669]/15 p-4">
                <Sparkles className="h-8 w-8 text-[#7775dc]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  Upgrade to AgentForge AI Pro
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Get access to your Pro plan and track your AI token usage and
                  available credits.
                </p>
              </div>

              <Button
                className="bg-[#373669] text-white hover:bg-[#373669]/90"
                onClick={async () => {
                  await authClient.checkout({
                    // Polar Product IDs
                    // products: ["63c6a229-166c-4e75-8291-a9cbfd429c86"],
                    // OR
                    // if "products" in passed in the checkout plugin's config, you may pass the slug
                    slug: "Pro",
                  });
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
