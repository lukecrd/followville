import type {Metadata} from 'next';
import './globals.css';
import './city-interface.css';
import './modern-theme.css';
export const metadata:Metadata={title:'FollowVille · La città della tua community',description:'Una città da costruire insieme. Dai a ogni follower un posto da chiamare casa.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="it"><body>{children}</body></html>;}
