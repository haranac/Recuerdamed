import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(undefined);

const DEMO_STORAGE_KEY = "recuerdamed_modo_demo";

const usuarioDemo = {
  id: "usuario-demostracion",
  email: "invitado@recuerdamed.demo",
  user_metadata: {
    nombre_completo: "Usuario invitado",
  },
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  const [modoDemo, setModoDemo] = useState(() => {
    return (
      sessionStorage.getItem(DEMO_STORAGE_KEY) === "true"
    );
  });

  const [loadingSession, setLoadingSession] =
    useState(true);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarSesion() {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (!componenteActivo) {
        return;
      }

      if (error) {
        console.error(
          "No se pudo recuperar la sesión:",
          error.message
        );
      }

      setSession(currentSession);

      /*
       * Una sesión real tiene prioridad sobre el modo demo.
       */
      if (currentSession) {
        setModoDemo(false);
        sessionStorage.removeItem(DEMO_STORAGE_KEY);
      }

      setLoadingSession(false);
    }

    cargarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!componenteActivo) {
          return;
        }

        setSession(currentSession);

        if (currentSession) {
          setModoDemo(false);
          sessionStorage.removeItem(DEMO_STORAGE_KEY);
        }

        setLoadingSession(false);
      }
    );

    return () => {
      componenteActivo = false;
      subscription.unsubscribe();
    };
  }, []);

  async function entrarComoInvitado() {
    /*
     * Normalmente el login solamente aparece cuando no
     * existe sesión, pero esto evita mezclar ambos modos.
     */
    if (session) {
      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        throw error;
      }
    }

    setSession(null);
    setModoDemo(true);

    sessionStorage.setItem(
      DEMO_STORAGE_KEY,
      "true"
    );
  }

  async function cerrarSesion() {
    if (modoDemo) {
      setModoDemo(false);
      sessionStorage.removeItem(DEMO_STORAGE_KEY);
      return;
    }

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      throw error;
    }
  }

  const user = modoDemo
    ? usuarioDemo
    : session?.user ?? null;

  const value = {
    session,
    user,
    modoDemo,
    soloLectura: modoDemo,
    loadingSession,
    entrarComoInvitado,
    cerrarSesion,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}