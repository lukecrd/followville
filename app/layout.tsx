import type {Metadata} from 'next';
import './globals.css';
import './city-interface.css';
import './modern-theme.css';
import './community.css';
import './social.css';
import './voting.css';
import './game-theme.css';
export const metadata:Metadata={title:'FollowVille · La città della tua community',description:'Una città da costruire insieme. Dai a ogni follower un posto da chiamare casa.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="it"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;700;800;900&display=swap"/></head><body>{children}</body></html>;}
