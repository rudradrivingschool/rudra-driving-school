// Login page for drivers only (no signup/register)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Lock } from 'lucide-react';

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginData.username, loginData.password);

    if (error) {
      toast.error(error.message || 'Invalid credentials');
    } else {
      toast.success('Successfully signed in!');
      navigate('/');
    }
    setIsLoading(false);
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4'>
            <span className='text-white font-bold text-xl'>Rudra</span>
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Rudra Driving School
          </h1>
          {/* <p className='text-gray-600 mt-2'>
            Sign in as a driver to manage your rides and students
          </p> */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Driver Login</CardTitle>
            <CardDescription>
              Enter your username and password to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='login-username'>Username</Label>
                <div className='relative'>
                  <User className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='login-username'
                    type='text'
                    placeholder='Enter your username'
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({ ...loginData, username: e.target.value })
                    }
                    className='pl-10'
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='login-password'>Password</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='login-password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Enter your password'
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className='pl-10 pr-10'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Lock className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Lock className='h-4 w-4 text-gray-400' />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type='submit'
                className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
