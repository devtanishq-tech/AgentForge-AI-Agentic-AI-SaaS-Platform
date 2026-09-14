import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  //==============================Fetching the session  coming from frontend side , when user is looked in
  const sessionDATA = await auth.api.getSession({
    headers: await headers(),
  });
  if (sessionDATA) {
    // means user is logged no need to go to the sign in  page right
    redirect("/");
  }
  return <>{children}</>;
}
