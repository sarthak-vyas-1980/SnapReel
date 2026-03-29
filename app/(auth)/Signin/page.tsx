import { AuthCard } from "@/components/auth/AuthCard"
import { SigninForm } from "@/components/auth/SigninForm"

export default function Signin() {
  return (
    <AuthCard 
      title="Welcome Back" 
      subtitle="Sign in to your SnapReel account"
    >
      <SigninForm />
    </AuthCard>
  )
}
