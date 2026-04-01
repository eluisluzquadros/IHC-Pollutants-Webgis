import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    getDoc,
    Timestamp
} from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

export interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: any;
    ownerId: string;
    settings?: any;
}

export interface Workspace {
    id: string;
    ownerId: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    projects: Project[];
    activeProject: Project | null;
    setActiveProject: (project: Project | null) => void;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    createProject: (name: string, description: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    // Sync projects from Firestore
    useEffect(() => {
        if (!user) {
            setProjects([]);
            setActiveProject(null);
            return;
        }

        const projectsRef = collection(db, 'projects');
        const q = query(projectsRef, where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsList: Project[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Project));

            setProjects(projectsList);

            // If no active project, set the first one as active
            if (!activeProject && projectsList.length > 0) {
                setActiveProject(projectsList[0]);
            }
        });

        return () => unsubscribe();
    }, [user, activeProject]);

    const syncUser = async (currentUser: User) => {
        // Run sync in the background to avoid blocking the auth state change
        const performSync = async () => {
            try {
                console.log('🔄 Syncing user data to Firestore...', currentUser.uid);
                const userRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userRef);

                if (!userDoc.exists()) {
                    console.log('🆕 Creating new user profile...');
                    await setDoc(userRef, {
                        email: currentUser.email,
                        displayName: currentUser.displayName,
                        photoURL: currentUser.photoURL,
                        lastLogin: Timestamp.now(),
                        createdAt: Timestamp.now()
                    });

                    // Create default project
                    const projectId = `proj_${Date.now()}`;
                    const projectRef = doc(db, 'projects', projectId);
                    await setDoc(projectRef, {
                        name: "Meu Primeiro Projeto",
                        description: "Projeto inicial para exploração ambiental.",
                        ownerId: currentUser.uid,
                        createdAt: Timestamp.now(),
                        settings: {
                            theme: 'dark',
                            defaultView: { lat: -22.9, lon: -43.2, zoom: 6 }
                        }
                    });
                } else {
                    // Update last login
                    await setDoc(userRef, { lastLogin: Timestamp.now() }, { merge: true });
                }
                console.log('✅ User sync complete');
            } catch (error: any) {
                console.error("❌ Error syncing user:", error);
                // Handle offline or permission errors gracefully
                if (error.code === 'unavailable' || error.message?.includes('offline')) {
                    console.warn('📡 Firestore is currently offline. Sync will retry when connection restored.');
                }
            }
        };

        // Don't await this in the main path to keep UI responsive
        performSync();
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);

            if (user) {
                syncUser(user);
            }
        });

        return () => unsubscribe();
    }, []);

    const createProject = async (name: string, description: string) => {
        if (!user) return;

        const projectId = `proj_${Date.now()}`;
        const projectRef = doc(db, 'projects', projectId);

        const newProject = {
            name,
            description,
            ownerId: user.uid,
            createdAt: Timestamp.now(),
            settings: {
                theme: 'dark',
                defaultView: { lat: -22.9, lon: -43.2, zoom: 6 }
            }
        };

        await setDoc(projectRef, newProject);
    };

    const loginWithGoogle = async () => {
        try {
            console.log('🔐 Initiating Google Login...');
            // Force account selection to avoid auto-login loops
            googleProvider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, googleProvider);
            console.log('✅ Google Login Success:', result.user.uid);

            // Trigger sync (non-blocking)
            syncUser(result.user);
        } catch (error: any) {
            console.error("❌ Google Login Failed:", error);

            // Detailed Error Handling
            if (error.code === 'auth/configuration-not-found') {
                throw new Error('Firebase Auth config missing. Check authDomain and authorized domains in Firebase Console.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                console.warn('Login popup closed by user');
            } else if (error.code === 'auth/unauthorized-domain') {
                throw new Error('Domain not authorized. Add this domain to Firebase Console > Auth > Settings.');
            } else {
                throw error;
            }
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            projects,
            activeProject,
            setActiveProject,
            loginWithGoogle,
            logout,
            createProject
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
