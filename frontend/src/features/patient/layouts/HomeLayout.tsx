import type { ReactNode } from "react"
import { Outlet } from "react-router-dom"
import { Header } from "../components/layout/Home/Header"
import { Footer } from "../components/layout/Home/Footer"

interface HomeLayoutProps {
  children?: ReactNode
}

export const HomeLayout = ({ children }: HomeLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children ? children : <Outlet />}
      </main>
      <Footer />
    </div>
  )
}