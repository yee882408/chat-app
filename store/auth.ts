import { create } from "zustand";
import { supabase } from "@/utils/supabase";
import { User, Session } from "@supabase/supabase-js";
import { persist } from "zustand/middleware";

type UserRole = 'admin' | 'user';

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  role: UserRole | null;
  isBanned: boolean;

  // Actions
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, username: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { username?: string; avatar_url?: string }) => Promise<void>;
  checkSession: () => Promise<boolean>;
  banUser: (userId: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  setUserRole: (userId: string, role: UserRole) => Promise<void>;
  getUserProfile: (userId: string) => Promise<any>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: false,
      error: null,
      role: null,
      isBanned: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Attempting login with email:', email);
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('Login error from Supabase:', error);
            throw error;
          }

          console.log('Login successful, data received:', !!data);

          // Ensure we have a valid session
          if (!data.session) {
            console.error('No session returned from login');
            throw new Error("No session returned from login");
          }

          console.log('Session received, user ID:', data.user?.id);
          console.log('Session access token exists:', !!data.session.access_token);

          // Fetch user profile to get role and banned status
          try {
            if (data.user?.id) {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

              if (!profileError && profileData) {
                console.log('User profile fetched during login:', profileData);

                // Check if user is banned
                if (profileData.is_banned) {
                  console.log('User is banned, showing notification');
                }

                // Update the store with session data and profile info
                set({
                  user: data.user,
                  session: data.session,
                  role: profileData.role || 'user',
                  isBanned: profileData.is_banned || false,
                  isLoading: false
                });
              } else {
                // Profile not found, set default values
                console.error('Error fetching user profile during login:', profileError);
                set({
                  user: data.user,
                  session: data.session,
                  role: 'user',
                  isBanned: false,
                  isLoading: false
                });
              }
            } else {
              // No user ID, set default values
              set({
                user: data.user,
                session: data.session,
                role: 'user',
                isBanned: false,
                isLoading: false
              });
            }
          } catch (profileError) {
            console.error('Error fetching profile during login:', profileError);
            // Set default values if profile fetch fails
            set({
              user: data.user,
              session: data.session,
              role: 'user',
              isBanned: false,
              isLoading: false
            });
          }

          // Manually ensure the session is saved to localStorage
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              const authData = {
                state: {
                  user: data.user,
                  session: data.session
                }
              };
              localStorage.setItem('auth-storage', JSON.stringify(authData));
              console.log('Login: Session saved to localStorage');

              // Also set a separate cookie as a backup
              document.cookie = `supabase-auth-user=${data.user.id}; path=/; max-age=86400; SameSite=Lax`;
              console.log('Login: Backup cookie set');
            }
          } catch (e) {
            console.error('Error saving session to localStorage:', e);
          }

          // Force a small delay to ensure the session is properly stored
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Login complete, returning data');

          return data;
        } catch (error: any) {
          console.error('Login error:', error);
          set({
            error: error.message || "Failed to login",
            isLoading: false
          });
          throw error;
        }
      },

      register: async (email: string, password: string, username: string) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Attempting registration with email:', email);

          // Register the user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username,
              },
            },
          });

          if (authError) {
            console.error('Registration error from Supabase:', authError);
            throw authError;
          }

          console.log('Registration successful, user created:', !!authData.user);
          console.log('Session created:', !!authData.session);

          // If registration is successful, also create a profile in the profiles table
          if (authData.user) {
            console.log('Creating profile for user ID:', authData.user.id);

            const { error: profileError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: authData.user.id,
                  username,
                  email,
                  created_at: new Date().toISOString(),
                  role: 'user',
                  is_banned: false
                },
              ]);

            if (profileError) {
              console.error('Error creating profile:', profileError);
              throw profileError;
            }

            console.log('Profile created successfully');
          }

          // Update the store with session data and default role/banned status
          set({
            user: authData.user,
            session: authData.session,
            role: 'user',
            isBanned: false,
            isLoading: false
          });

          // Manually ensure the session is saved to localStorage
          try {
            if (typeof window !== 'undefined' && window.localStorage && authData.user) {
              const authStoreData = {
                state: {
                  user: authData.user,
                  session: authData.session
                }
              };
              localStorage.setItem('auth-storage', JSON.stringify(authStoreData));
              console.log('Registration: Session saved to localStorage');

              // Also set a separate cookie as a backup
              if (authData.user.id) {
                document.cookie = `supabase-auth-user=${authData.user.id}; path=/; max-age=86400; SameSite=Lax`;
                console.log('Registration: Backup cookie set');
              }
            }
          } catch (e) {
            console.error('Error saving session to localStorage:', e);
          }

          // Force a small delay to ensure the session is properly stored
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log('Registration complete, returning data');

          return authData;
        } catch (error: any) {
          console.error('Registration error:', error);
          set({
            error: error.message || "Failed to register",
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('Logging out user...');

          // First clear the local state
          set({
            user: null,
            session: null,
            role: null,
            isBanned: false,
            isLoading: true
          });

          // Then sign out from Supabase
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.error('Error signing out from Supabase:', error);
            throw error;
          }

          console.log('Successfully signed out from Supabase');

          // Clear any persisted data in localStorage
          if (typeof window !== 'undefined') {
            try {
              // Clear localStorage
              localStorage.removeItem('auth-storage');
              console.log('Cleared auth-storage from localStorage');

              // Clear our backup cookie
              document.cookie = 'supabase-auth-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
              console.log('Cleared backup cookie');

              // Clear all possible auth cookies
              document.cookie = 'auth-storage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
              document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
              document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
              console.log('Cleared all possible auth cookies');
            } catch (e) {
              console.error('Error clearing cookies/localStorage:', e);
            }
          }

          // Ensure we're fully logged out
          set({
            user: null,
            session: null,
            role: null,
            isBanned: false,
            isLoading: false
          });

          console.log('Logout successful, all state cleared');

          // Force a small delay to ensure the session is properly cleared
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
          console.error('Error during logout:', error);
          set({
            error: error.message || "Failed to logout",
            isLoading: false
          });
          throw error;
        }
      },

      resetPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (error) throw error;
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "Failed to send reset password email",
            isLoading: false
          });
          throw error;
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const user = get().user;
          if (!user) throw new Error("User not authenticated");

          const { error } = await supabase
            .from('profiles')
            .update(data)
            .eq('id', user.id);

          if (error) throw error;

          // Update user metadata if username is provided
          if (data.username) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: { username: data.username },
            });

            if (updateError) throw updateError;
          }

          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || "Failed to update profile",
            isLoading: false
          });
          throw error;
        }
      },

      checkSession: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('Checking session in auth store...');
          const { data, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error from supabase.auth.getSession():', error);
            throw error;
          }

          console.log('Session data received:', data ? 'exists' : 'null');
          console.log('Session object exists:', !!data.session);

          if (data.session) {
            console.log('Session user exists:', !!data.session.user);
            console.log('Session access_token exists:', !!data.session.access_token);
            console.log('Session expires_at:', data.session.expires_at);

            // Check if token is expired
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = data.session.expires_at;
            const isExpired = expiresAt && now > expiresAt;

            console.log('Current time (seconds):', now);
            console.log('Token expired:', isExpired);
          }

          const hasValidSession = !!data.session && !!data.session.user;
          console.log('Has valid session:', hasValidSession);

          // If we have a valid session, fetch the user profile to get role and banned status
          if (hasValidSession && data.session?.user?.id) {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.session.user.id)
                .single();

              if (!profileError && profileData) {
                console.log('User profile fetched:', profileData);

                // Set role and banned status
                set({
                  role: profileData.role || 'user',
                  isBanned: profileData.is_banned || false
                });
              } else {
                console.error('Error fetching user profile:', profileError);
                // Default to user role and not banned
                set({
                  role: 'user',
                  isBanned: false
                });
              }
            } catch (profileFetchError) {
              console.error('Error in profile fetch:', profileFetchError);
              // Default to user role and not banned
              set({
                role: 'user',
                isBanned: false
              });
            }
          }

          // Update the store with session data
          set({
            user: data.session?.user || null,
            session: data.session,
            isLoading: false
          });

          // If we have a session but no user in the store, refresh the state
          if (hasValidSession && !get().user) {
            console.log('Session exists but user is not in store, refreshing state');
            set({ user: data.session.user });
          }

          // Ensure the session is saved to localStorage
          if (hasValidSession) {
            try {
              // Check if localStorage is available (client-side only)
              if (typeof window !== 'undefined' && window.localStorage) {
                const authData = {
                  state: {
                    user: data.session.user,
                    session: data.session
                  }
                };
                localStorage.setItem('auth-storage', JSON.stringify(authData));
                console.log('Session saved to localStorage');
              }
            } catch (e) {
              console.error('Error saving session to localStorage:', e);
            }
          }

          return hasValidSession;
        } catch (error: any) {
          console.error('Error checking session:', error);
          set({
            error: error.message || "Failed to check session",
            isLoading: false,
            user: null,
            session: null,
            role: null,
            isBanned: false
          });
          return false;
        }
      },

      getUserProfile: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) throw error;
          return data;
        } catch (error: any) {
          console.error('Error fetching user profile:', error);
          throw error;
        }
      },

      banUser: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Check if current user is admin
          const currentUser = get().user;
          const currentRole = get().role;

          if (!currentUser || currentRole !== 'admin') {
            throw new Error('Only admins can ban users');
          }

          // Update the user's profile to set banned status
          const { error } = await supabase
            .from('profiles')
            .update({ is_banned: true })
            .eq('id', userId);

          if (error) throw error;

          set({ isLoading: false });
          console.log(`User ${userId} has been banned`);
        } catch (error: any) {
          set({
            error: error.message || "Failed to ban user",
            isLoading: false
          });
          throw error;
        }
      },

      unbanUser: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Check if current user is admin
          const currentUser = get().user;
          const currentRole = get().role;

          if (!currentUser || currentRole !== 'admin') {
            throw new Error('Only admins can unban users');
          }

          // Update the user's profile to remove banned status
          const { error } = await supabase
            .from('profiles')
            .update({ is_banned: false })
            .eq('id', userId);

          if (error) throw error;

          set({ isLoading: false });
          console.log(`User ${userId} has been unbanned`);
        } catch (error: any) {
          set({
            error: error.message || "Failed to unban user",
            isLoading: false
          });
          throw error;
        }
      },

      setUserRole: async (userId: string, role: UserRole) => {
        set({ isLoading: true, error: null });
        try {
          // Check if current user is admin
          const currentUser = get().user;
          const currentRole = get().role;

          if (!currentUser || currentRole !== 'admin') {
            throw new Error('Only admins can change user roles');
          }

          // Update the user's profile to set the new role
          const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

          if (error) throw error;

          // If updating own role, update the store
          if (currentUser.id === userId) {
            set({ role });
          }

          set({ isLoading: false });
          console.log(`User ${userId} role set to ${role}`);
        } catch (error: any) {
          set({
            error: error.message || "Failed to set user role",
            isLoading: false
          });
          throw error;
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        role: state.role,
        isBanned: state.isBanned
      }),
    }
  )
);
