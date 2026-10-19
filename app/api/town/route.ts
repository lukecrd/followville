import {env} from 'cloudflare:workers';
import {createTownApi} from './handlers';
export const dynamic='force-dynamic';
const api=createTownApi(env,import.meta.env.DEV);
export async function GET(request:Request){return api.GET(request);}
export async function POST(request:Request){return api.POST(request);}
