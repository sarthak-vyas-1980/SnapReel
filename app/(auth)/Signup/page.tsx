import { AuthCard } from "@/components/auth/AuthCard"
import { SignupForm } from "@/components/auth/SignupForm"

export default function Signup() {
  return (
    <AuthCard 
      title="Create Account" 
      subtitle="Start creating viral reels in seconds"
    >
      <SignupForm />
    </AuthCard>
  )
}
