import type {Metadata} from 'next';
import '../.generated/ui/globals.css';
import '../.generated/ui/city-interface.css';
import '../.generated/ui/modern-theme.css';
import '../.generated/ui/community.css';
import '../.generated/ui/social.css';
import '../.generated/ui/voting.css';
import './account.css';
export const metadata:Metadata={title:'FollowVille · La città della tua community',description:'Una città da costruire insieme.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="it"><body>{children}</body></html>;}
