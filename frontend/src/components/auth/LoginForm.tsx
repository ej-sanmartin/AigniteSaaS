'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                     focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
          />
          {errors.email && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                     focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
          />
          {errors.password && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent 
                   rounded-md shadow-sm text-sm font-medium text-white 
                   bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                   dark:focus:ring-offset-gray-900"
        >
          Sign in
        </button>
      </form>

      <div className="text-center mt-4">
        <Link 
          href="/signup"
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Don't have an account? Sign up
        </Link>
      </div>
    </>
  );
} 