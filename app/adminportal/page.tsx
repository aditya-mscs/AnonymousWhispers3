import { redirect } from "next/navigation"
import { checkAdminSession, getAdminUrl } from "@/lib/admin"
import { AdminLoginForm } from "@/components/admin/login-form"

export default async function AdminPage() {
  // If already logged in, redirect to dashboard
  if (await checkAdminSession()) {
    redirect(`${getAdminUrl()}/dashboard`)
  }

  return (
    <div className="container max-w-screen-lg mx-auto py-10">
      <h1 className="text-3xl font-bold text-center mb-8">Admin Portal</h1>
      <AdminLoginForm />
    </div>
  )
}

