'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type SignupForm = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: formSetError,
    clearErrors,
    watch
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema)
  });

  const handleConfirmPasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const password = watch('password');
    const confirmPassword = e.target.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      formSetError('confirmPassword', {
        type: 'manual',
        message: "Passwords don't match"
      });
    } else {
      clearErrors('confirmPassword');
    }
  };

  const handlePasswordBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const password = e.target.value;
    
    if (password && password.length < 8) {
      formSetError('password', {
        type: 'manual',
        message: 'Password must be at least 8 characters'
      });
    } else {
      clearErrors('password');
    }
  };

  const onSubmit = async (data: SignupForm) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName
        }),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create account');
      }

      // If successful, redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to create account. Please try again.');
    }
  };

  const inputClasses = [
    "mt-1 block w-full rounded-md border",
    "border-gray-300 dark:border-gray-600 px-3 py-2",
    "bg-white dark:bg-gray-800 text-gray-900 dark:text-white",
    "focus:ring-blue-500 dark:focus:ring-blue-400",
    "focus:border-blue-500 dark:focus:border-blue-400"
  ].join(' ');

  const errorContainerClasses = [
    "bg-red-100 dark:bg-red-900/30",
    "border border-red-400 dark:border-red-500/50",
    "text-red-700 dark:text-red-400 px-4 py-3 rounded"
  ].join(' ');

  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const errorClasses = "text-red-500 dark:text-red-400 text-sm mt-1";

  return (
    <>
      {error && (
        <div className={errorContainerClasses}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="firstName" className={labelClasses}>
            First Name
          </label>
          <input
            {...register('firstName')}
            type="text"
            className={inputClasses}
          />
          {errors.firstName && (
            <p className={errorClasses}>{errors.firstName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className={labelClasses}>
            Last Name
          </label>
          <input
            {...register('lastName')}
            type="text"
            className={inputClasses}
          />
          {errors.lastName && (
            <p className={errorClasses}>{errors.lastName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className={inputClasses}
          />
          {errors.email && (
            <p className={errorClasses}>{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className={labelClasses}>
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            onBlur={handlePasswordBlur}
            className={inputClasses}
          />
          {errors.password && (
            <p className={errorClasses}>{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClasses}>
            Confirm Password
          </label>
          <input
            {...register('confirmPassword')}
            type="password"
            onBlur={handleConfirmPasswordBlur}
            className={inputClasses}
          />
          {errors.confirmPassword && (
            <p className={errorClasses}>{errors.confirmPassword.message}</p>
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
          Sign up
        </button>
      </form>

      <div className="text-center mt-4">
        <Link 
          href="/login"
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Already have an account? Sign in
        </Link>
      </div>
    </>
  );
} 