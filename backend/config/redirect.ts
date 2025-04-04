interface RedirectConfig {
  // URL validation configuration
  allowedDomains: string[];
  allowedPaths: string[];
  
  // Role-based redirect configuration
  roleBasedRedirects: {
    authenticated: {
      [role: string]: string;
    };
    unauthenticated: string;
  };
  
  // Error fallback configuration
  defaultRedirect: string;
}

// Default configuration that can be overridden by environment variables
const config: RedirectConfig = {
  // List of allowed domains for redirects
  // This is about URL validation, not authentication
  allowedDomains: [
    process.env.FRONTEND_DOMAIN || 'localhost',
    process.env.BACKEND_DOMAIN || 'localhost:3001'
  ],
  
  // List of allowed paths for redirects
  // This is about URL validation, not authentication
  allowedPaths: [
    '/',           // Root path
    '/dashboard',  // Dashboard is a valid destination (auth handled by frontend)
    '/profile',    // Profile is a valid destination (auth handled by frontend)
    '/settings',   // Settings is a valid destination (auth handled by frontend)
    '/subscription',
    '/billing'
  ],
  
  // Role-based redirects for different authentication states
  roleBasedRedirects: {
    authenticated: {
      admin: '/admin/dashboard',
      user: '/dashboard'
    },
    unauthenticated: '/'  // Default for unauthenticated users
  },
  
  // Safe fallback for any error case
  // This should be a path that's always accessible
  defaultRedirect: '/'
};

export default config;