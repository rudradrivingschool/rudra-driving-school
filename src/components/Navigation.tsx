import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface NavigationProps {
  userRole: string;
}

export const Navigation = ({ userRole }: NavigationProps) => {
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Successfully signed out');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // Hide dropdown/profile menu for driver (no account functions except logout)
  return (
    <nav className='bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 w-full'>
      <div className='container max-w-full mx-auto px-2 sm:px-4 py-2 sm:py-4'>
        <div className='flex items-center justify-between flex-wrap gap-2'>
          <div className='flex items-center space-x-2'>
            <div className='w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>Rudra</span>
            </div>
            <span className='hidden md:block sm:2xl md:text-4xl font-extrabold bg-gradient-to-r from-sky-600 via-[#B33791] to-primary bg-clip-text text-transparent drop-shadow-[0_1px_1px_rgba(129,98,248,0.18)]'>
              Rudra Driving School
            </span>
          </div>
          <div className='flex items-center space-x-2'>
            {user && userRole !== 'driver' && (
              <div className='flex items-center space-x-2'>
                {/* <span className='text-sm text-gray-600 hidden sm:block'>
                  Welcome, {user.name}
                </span> */}
                <Badge variant='default' className='text-sm font-semibold'>
                  {user.role || 'driver'}
                </Badge>
              </div>
            )}
            {/* User Menu: show for admin/superadmin, just show logout for driver */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='flex items-center gap-1 sm:gap-2'
                >
                  <User className='w-4 h-4' />
                  <ChevronDown className='w-4 h-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='bg-white'>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className='w-4 h-4 mr-2' />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
