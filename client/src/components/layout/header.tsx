import { useState } from "react";
import { Button } from "@/components/ui/button";
import SubAccountSwitcher from "@/components/shared/sub-account-switcher";
import { useSubAccount } from "@/context/sub-account-context";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";

export default function Header({ title }: { title?: string }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { currentSubAccount } = useSubAccount();

  return (
    <>
      {/* Mobile Header */}
      <header className="bg-white shadow-sm py-3 px-4 flex items-center justify-between md:hidden z-20">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => {
            const sidebarElement = document.querySelector('aside');
            if (sidebarElement) {
              sidebarElement.classList.toggle('-translate-x-full');
              setIsSidebarOpen(!isSidebarOpen);
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-neutral-500"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </Button>
        
        <div className="flex items-center">
          {currentSubAccount && (
            <>
              {currentSubAccount.logo ? (
                <img 
                  src={currentSubAccount.logo} 
                  alt="Company logo" 
                  className="w-8 h-8 rounded mr-2"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center mr-2">
                  <span className="font-medium text-sm">
                    {currentSubAccount.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-heading font-semibold text-primary text-sm">
                {currentSubAccount.name}
              </span>
            </>
          )}
        </div>
        
        <NotificationDropdown />
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex bg-white shadow-sm py-3 px-6 items-center justify-between border-b">
        {title && (
          <h1 className="text-xl font-heading font-semibold">{title}</h1>
        )}
        
        <div className="flex items-center gap-4">
          <div className="md:hidden lg:block">
            <SubAccountSwitcher />
          </div>
          
          <NotificationDropdown />
        </div>
      </header>
    </>
  );
}
