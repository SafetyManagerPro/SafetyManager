// js/safety_env.js
// Configurazione runtime Supabase per deploy statico/online.
// Nota: questa è la anon key pubblica client-side. La protezione dei dati deve essere garantita da RLS/policy Supabase.

window.SAFETY_SUPABASE_URL = window.SAFETY_SUPABASE_URL || 'https://gblcedkfnasqlnrxupzx.supabase.co';
window.SAFETY_SUPABASE_ANON_KEY = window.SAFETY_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdibGNlZGtmbmFzcWxucnh1cHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NDU3NzksImV4cCI6MjA5NzMyMTc3OX0.KKt8nVCPnYsdHBITY0w901CvLweIVdmxJWVgEVCPDNs';

window.SAFETY_BUILD_VERSION = 'step40-cache-fix';
