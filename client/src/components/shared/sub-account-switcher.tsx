import { useState } from 'react';
import { useSubAccount } from '@/context/sub-account-context';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials } from '@/lib/utils';

export default function SubAccountSwitcher() {
  const { subAccounts, currentSubAccount, isLoading, switchSubAccount } = useSubAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Filter subaccounts by search query
  const filteredAccounts = subAccounts.filter((account: any) =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg bg-neutral-100">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-32 ml-2" />
        <Skeleton className="h-4 w-4 ml-auto" />
      </div>
    );
  }

  if (!currentSubAccount && subAccounts.length === 0) {
    return (
      <div className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg bg-neutral-100 text-neutral-500">
        <span>No accounts available</span>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between bg-neutral-100 border-neutral-200"
        >
          <div className="flex items-center">
            {currentSubAccount?.logo ? (
              <img
                src={currentSubAccount.logo}
                alt={`${currentSubAccount.name} logo`}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center mr-2 text-xs">
                {currentSubAccount ? getInitials(currentSubAccount.name) : 'N/A'}
              </div>
            )}
            <span className="font-medium truncate">
              {currentSubAccount?.name || 'Select Account'}
            </span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {filteredAccounts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-neutral-500">No accounts found</p>
            </div>
          ) : (
            filteredAccounts.map((account: any) => (
              <Button
                key={account.id}
                variant="ghost"
                className={`w-full justify-start p-3 ${
                  currentSubAccount?.id === account.id
                    ? 'bg-primary bg-opacity-10'
                    : ''
                }`}
                onClick={() => {
                  switchSubAccount(account.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  {account.logo ? (
                    <img
                      src={account.logo}
                      alt={`${account.name} logo`}
                      className="w-8 h-8 rounded-lg mr-3"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center mr-3">
                      {getInitials(account.name)}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-neutral-500">
                      {account.active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
