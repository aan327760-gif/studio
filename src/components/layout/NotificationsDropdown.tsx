
"use client";

import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";

const MOCK_NOTIFS = [
  { id: 1, text: "Ahmed Salem liked your post", time: "2m ago", unread: true },
  { id: 2, text: "New message in 'Startup Hub'", time: "15m ago", unread: true },
  { id: 3, text: "Sarah Connor started following you", time: "1h ago", unread: false },
];

export function NotificationsDropdown() {
  const { t, isRtl } = useLanguage();
  const unreadCount = MOCK_NOTIFS.filter(n => n.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-[10px] border-none">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRtl ? "start" : "end"} className="w-80 p-2">
        <DropdownMenuLabel className="flex justify-between items-center px-2 py-1.5">
          <span>{isRtl ? "التنبيهات" : "Notifications"}</span>
          <Button variant="ghost" size="sm" className="h-auto text-[10px] p-1 h-6">
            {isRtl ? "تحديد الكل كمقروء" : "Mark all read"}
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {MOCK_NOTIFS.map((notif) => (
            <DropdownMenuItem key={notif.id} className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${notif.unread ? "bg-muted/30" : ""}`}>
              <p className="text-sm font-medium">{notif.text}</p>
              <p className="text-[10px] text-muted-foreground">{notif.time}</p>
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <Button variant="ghost" className="w-full text-xs h-8 text-primary">
          {isRtl ? "عرض الكل" : "View all notifications"}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
