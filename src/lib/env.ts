/**
 * Expo inyecta en tiempo de build las variables con prefijo EXPO_PUBLIC_
 * definidas en .env. Deben accederse con `process.env.NOMBRE` literal
 * (no con destructuring) para que el bundler las reemplace.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

function required(name: string, value: string | undefined): string {
  if (!value || value.includes('TU-PROYECTO') || value.startsWith('tu-')) {
    throw new Error(
      `[Dulce Hogar] Falta la variable ${name}. Copiá .env.example a .env, ` +
        'completá los valores de Supabase y reiniciá `npx expo start -c`.',
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', SUPABASE_URL),
  supabaseAnonKey: required('EXPO_PUBLIC_SUPABASE_ANON_KEY', SUPABASE_ANON_KEY),
};
