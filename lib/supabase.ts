//Es la función maestra de Supabase que abre el túnel de comunicación.
import { createClient } from '@supabase/supabase-js';                  

// Lee las llaves que se puso en el archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Se crea una sola instancia de la conexión para toda la app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);