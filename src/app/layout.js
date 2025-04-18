import { Inter } from 'next/font/google'
import './globals.css'
import Chatbot from '../components/Chatbot'
import { mongoColors } from '../theme'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MongoDB RAG Chunking Demo',
  description: 'A demonstration of RAG chunking strategies with MongoDB Vector Search',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-100">
          {children}
          <Chatbot colors={mongoColors} />
        </div>
      </body>
    </html>
  )
}