"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getThreads } from "@/lib/threadData";
import { thread } from "@/db/schema/chat-schema";

type Thread = {
  title: string;
  id: string;
  createdAt: Date;
};

export function ThreadsLists() {
  const { data, error, isError, isLoading } = useQuery<Thread[]>({
    queryKey: ["thread"],
    queryFn: getThreads,
  });
  console.log(`Data :`, data);
  {
    /*----------------------------------MEANS Loading Exist -----------------------------*/
  }
  if (isLoading) {
    return (
      <>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => {
          return (
            <SidebarMenuItem
              key={item}
              className="group/item relative pointer-events-none"
            >
              <SidebarMenuButton
                className={cn(
                  "h-9 rounded-lg transition-all px-3 pr-10 cursor-pointer",
                  "hover:bg-transparent",
                )}
              >
                <Skeleton className="w-full h-full bg-[#212121]" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </>
    );
  }
  //===========================================//
  const threadMenuContent = (
    <>
      {data?.length === 0 ? (
        <span className="p-3">No old chat exist </span>
      ) : (
        data?.map((current) => {
          return (
            <SidebarMenuItem key={current.id} className="group/item relative">
              <Link href={`/chat/${current.id}`}>
                <SidebarMenuButton
                  className={cn(
                    "h-9 rounded-lg transition-all px-3 pr-10 cursor-pointer",
                    "hover:bg-transparent",
                  )}
                >
                  <span>{current.title}</span>
                  {/* <Skeleton className="w-full h-full bg-[#212121]" /> */}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        })
      )}
    </>
  );
  if (isError) {
    return (
      <>
        <SidebarMenuItem className="group/item relative pointer-events-none">
          <SidebarMenuButton
            className={cn(
              "h-9 rounded-lg transition-all px-3 pr-10 cursor-pointer",
              "hover:bg-transparent",
            )}
          >
            <span>{error.message}</span>
            {/* <Skeleton className="w-full h-full bg-[#212121]" /> */}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </>
    );
  }

  return (
    <>
      <SidebarGroup className="p-0 group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-[12px] font-medium text-[#b4b4b4] px-3 mb-1 mt-4">
          Recent
        </SidebarGroupLabel>
        <SidebarMenu className="gap-0.5">{threadMenuContent}</SidebarMenu>
      </SidebarGroup>
    </>
  );
}

export default ThreadsLists;
