import { LoginView } from "@/components/login-view"

export const dynamic = "force-dynamic"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const { message } = await searchParams

  return <LoginView message={message} />
}
