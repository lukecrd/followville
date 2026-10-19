export const ADMIN_ACTIONS=new Set(['rename','build','assign','remove','expand','invite','approve','board-pin','project-create','party-admin-create','poll-create','poll-close']);
export async function tokenHash(token:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}
